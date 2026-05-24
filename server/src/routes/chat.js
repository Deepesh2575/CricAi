import { Router } from "express";
import { getMatchById, saveMatch } from "../repositories/matchRepository.js";
import { parseAgentIntent } from "../services/nlpAgent.js";
import {
  applyBall,
  resetMatch,
  formatStatsReply,
  getWinProbabilities,
} from "../services/matchLogic.js";

const router = Router();

router.post("/:matchId", async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ ok: false, error: "message required" });
    }

    const match = await getMatchById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ ok: false, error: "Match not found" });
    }

    const { reply, action, updates } = parseAgentIntent(message);

    Object.assign(match, updates);

    let finalReply = reply;
    if (reply === "stats") {
      finalReply = formatStatsReply(match);
    }

    let ballResult = null;
    if (action?.type === "reset") {
      resetMatch(match);
    } else if (action?.type === "bowl") {
      ballResult = applyBall(match, action.outcome);
      if (ballResult.error) {
        finalReply = ballResult.error;
      } else {
        finalReply = `${reply}\n\n🎙️ ${ballResult.commentary}`;
      }
    }

    const saved = await saveMatch(match);

    res.json({
      ok: true,
      reply: finalReply,
      action,
      match: saved,
      ballResult: ballResult
        ? {
            commentary: ballResult.commentary,
            outcome: ballResult.outcome,
            victory: ballResult.victory,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
