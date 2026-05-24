import { Router } from "express";
import { isMemoryMode } from "../config/db.js";
import {
  createMatch,
  getMatchById,
  saveMatch,
} from "../repositories/matchRepository.js";
import { compileHinglishCommentary } from "../services/commentaryEngine.js";
import {
  applyBall,
  resetMatch,
  calcBattingShotOutcome,
  getWinProbabilities,
} from "../services/matchLogic.js";
import { getScenarioDefaults } from "../services/scenarioDefaults.js";
import { generateLiveMatchCommentary, fetchRealCricinfoCommentary } from "../services/agentService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const scenario = req.body.scenario || "death";
    const match = await createMatch(scenario);
    res.status(201).json({
      ok: true,
      match,
      dbMode: isMemoryMode() ? "memory" : "mongodb",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const match = await getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ ok: false, error: "Match not found" });
    }
    res.json({
      ok: true,
      match,
      probabilities: getWinProbabilities(match),
      dbMode: isMemoryMode() ? "memory" : "mongodb",
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/setup", async (req, res, next) => {
  try {
    const match = await getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ ok: false, error: "Match not found" });
    }

    const allowed = [
      "striker",
      "strikerStyle",
      "bowler",
      "commentaryStyle",
      "scenario",
      "target",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) match[key] = req.body[key];
    }

    if (req.body.loadScenario) {
      const defaults = getScenarioDefaults(req.body.loadScenario);
      Object.assign(match, defaults);
      match.scenario = req.body.loadScenario;
      match.latestCommentary = `Arena configured for ${req.body.loadScenario}! Bowl a delivery.`;
    }

    const saved = await saveMatch(match);
    res.json({ ok: true, match: saved });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reset", async (req, res, next) => {
  try {
    const match = await getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ ok: false, error: "Match not found" });
    }
    const raw = req.body.scenario ?? match.scenario;
    const scenario =
      typeof raw === "string" ? raw : raw?.scenario || match.scenario;
    resetMatch(match, scenario);
    const saved = await saveMatch(match);
    res.json({ ok: true, match: saved });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/balls", async (req, res, next) => {
  try {
    const match = await getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ ok: false, error: "Match not found" });
    }

    let { outcome, shotType, customShotText, customRuns } = req.body;

    if (shotType) {
      const shot = calcBattingShotOutcome(shotType, match.striker, match.bowler);
      outcome = shot.outcome;
      customShotText = shot.shotText;
    }

    if (!outcome) {
      return res.status(400).json({ ok: false, error: "outcome or shotType required" });
    }

    const result = applyBall(match, outcome, { customShotText, customRuns });

    if (result.error) {
      return res.status(400).json({ ok: false, error: result.error, match: result.match });
    }

    const saved = await saveMatch(result.match);

    res.status(201).json({
      ok: true,
      match: saved,
      commentary: result.commentary,
      outcome: result.outcome,
      ballLog: result.ballLog,
      victory: result.victory,
      probabilities: getWinProbabilities(saved),
      apiLog: {
        method: "POST",
        endpoint: `/api/matches/${req.params.id}/balls`,
        payload: result.ballLog,
        response: {
          status: 201,
          recordId: saved.id || saved._id,
          dbMode: isMemoryMode() ? "memory" : "mongodb",
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/live-ball", async (req, res, next) => {
  try {
    const match = await getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ ok: false, error: "Match not found" });
    }

    const { outcome, score, wickets, overs, desc, languageId, matchGuid } = req.body;

    let finalOutcome = outcome;
    let finalScore = score;
    let finalWickets = wickets;
    let finalOvers = overs;

    // Fetch actual real-world cricinfo details to keep scoreboard and commentary in 100% lock-step sync!
    const realComm = matchGuid ? await fetchRealCricinfoCommentary(matchGuid) : null;
    if (realComm) {
      finalScore = realComm.totalInningRuns || score;
      finalWickets = realComm.totalInningWickets || wickets;
      finalOvers = realComm.oversActual || overs;
      
      if (realComm.isWicket) finalOutcome = "WICKET";
      else if (realComm.isSix) finalOutcome = "SIX";
      else if (realComm.isFour) finalOutcome = "FOUR";
      else if (realComm.runs > 0) finalOutcome = "RUNS";
      else finalOutcome = "DOT";
    }

    match.score = finalScore;
    match.wickets = finalWickets;
    match.overs = finalOvers;
    match.ballsInOver = Math.round((finalOvers % 1) * 10);

    // Attempt to generate real-world commentary using Gemini Google Search grounding
    let baseCom = await generateLiveMatchCommentary({
      desc,
      score: finalScore,
      wickets: finalWickets,
      overs: finalOvers,
      commentaryStyle: match.commentaryStyle,
      languageId: languageId || "hinglish",
      matchGuid,
      preFetchedRealComm: realComm, // Avoid double-fetching
    });

    // Fall back to template-based Hinglish commentary if search commentary returns null
    if (!baseCom) {
      baseCom = compileHinglishCommentary(
        finalOutcome,
        match.commentaryStyle,
        match.scenario,
        match.striker,
        match.strikerStyle,
        match.bowler
      );
    }

    const commentary = baseCom;
    match.latestCommentary = commentary;

    const ballNo = `${Math.floor(match.overs)}.${match.ballsInOver}`;
    match.feedHistory = [
      {
        outcome: finalOutcome,
        text: `${desc}. ${baseCom}`,
        ballNo,
        batsman: match.striker,
        bowler: match.bowler,
        createdAt: new Date(),
      },
      ...(match.feedHistory || []),
    ].slice(0, 50);
    match.feedCount = (match.feedCount || 0) + 1;

    const saved = await saveMatch(match);
    res.json({
      ok: true,
      match: saved,
      commentary,
      outcome,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
