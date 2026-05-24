import { compileHinglishCommentary } from "./commentaryEngine.js";
import { getScenarioDefaults } from "./scenarioDefaults.js";

export function getWinProbabilities(match) {
  const { score, wickets, target, scenario, overs, ballsInOver } = match;
  if (score >= target) return { batting: 100, bowling: 0 };
  if (wickets >= 10) return { batting: 0, bowling: 100 };

  let batting = 50;
  const diff = target - score;

  if (scenario === "death" || scenario === "lastball") {
    const currentTotalBalls = Math.floor(overs) * 6 + ballsInOver;
    const ballsRemaining = Math.max(1, 120 - currentTotalBalls);
    const reqRunRate = (diff / ballsRemaining) * 6;

    if (reqRunRate > 18) batting = 8;
    else if (reqRunRate > 13) batting = 22;
    else if (reqRunRate > 9) batting = 45;
    else batting = 78;

    batting -= wickets * 4.5;
    batting = Math.max(4, Math.min(96, batting));
  } else {
    batting = 65 - wickets * 6;
    batting = Math.max(10, Math.min(90, batting));
  }

  return { batting, bowling: 100 - batting };
}

export function formatStatsReply(match) {
  const probs = getWinProbabilities(match);
  const runNeeded = Math.max(0, match.target - match.score);
  const ballsLeft = Math.max(
    1,
    120 - (Math.floor(match.overs) * 6 + match.ballsInOver)
  );
  const rrr = ((runNeeded / ballsLeft) * 6).toFixed(2);
  return `📊 CricAI Analytics:\n• Batting win prob: ${probs.batting.toFixed(0)}%\n• Score: ${match.score}/${match.wickets} | Target: ${match.target}\n• Need: ${runNeeded} runs in ${ballsLeft} balls\n• Required RR: ${rrr} per over`;
}

function checkVictory(match) {
  let title = "";
  let message = "";
  let ended = false;
  let status = match.status;

  if (match.score >= match.target) {
    title = `${match.striker} Finished Off In Style! 🏆`;
    message =
      '"Yeh shot toh kamaal tha dosto! Batting team ne cup utha liya! Stadium mein dhol-nagada!"';
    ended = true;
    status = "won";
  } else if (match.wickets >= 10) {
    title = `${match.bowler} Wins the Championship! 👑`;
    message =
      '"All out ho gayi batting team! Bowling team is CHAMPION!"';
    ended = true;
    status = "allout";
  } else if (match.scenario === "death" || match.scenario === "lastball") {
    const currentTotalBalls =
      Math.floor(match.overs) * 6 + Math.round((match.overs % 1) * 10);
    if (currentTotalBalls >= 120 && match.score < match.target) {
      title = `${match.bowler} Defends the Title! 🌟`;
      message =
        '"Overs khatam par target poora nahi hua! Bowler ne defend kar liya!"';
      ended = true;
      status = "lost";
    }
  }

  return { ended, title, message, status };
}

export function applyBall(match, outcome, options = {}) {
  if (match.status !== "active") {
    return {
      error: "Match completed! Reset scoreboard to play again.",
      match,
    };
  }

  const { customShotText = "", customRuns = 0 } = options;
  let runsAdded = 0;
  let isBall = true;

  if (outcome === "SIX") runsAdded = 6;
  else if (outcome === "FOUR") runsAdded = 4;
  else if (outcome === "RUNS")
    runsAdded = customRuns > 0 ? customRuns : Math.floor(Math.random() * 3) + 1;
  else if (outcome === "WICKET") {
    match.wickets += 1;
    isBall = true;
  } else if (outcome === "EXTRA") {
    runsAdded = 1;
    isBall = false;
  }

  if (outcome !== "WICKET") {
    match.score += runsAdded;
  }

  if (isBall) {
    let nextBalls = match.ballsInOver + 1;
    if (nextBalls >= 6) {
      match.overs = parseFloat((Math.floor(match.overs) + 1).toFixed(0));
      match.ballsInOver = 0;
    } else {
      match.overs = parseFloat(
        (Math.floor(match.overs) + nextBalls / 10).toFixed(1)
      );
      match.ballsInOver = nextBalls;
    }
  }

  let shotAngle = 0;
  let shotLength = 0;
  if (outcome === "SIX") {
    shotAngle = -45 + Math.random() * 90;
    shotLength = 110 + Math.random() * 25;
  } else if (outcome === "FOUR") {
    shotAngle = -75 + Math.random() * 150;
    shotLength = 85 + Math.random() * 15;
  } else if (outcome === "RUNS") {
    shotAngle = -90 + Math.random() * 180;
    shotLength = 40 + Math.random() * 35;
  } else if (outcome === "WICKET" || outcome === "DOT") {
    shotAngle = -10 + Math.random() * 20;
    shotLength = 15 + Math.random() * 25;
  }

  if (shotLength > 0) {
    match.wagonWheel = match.wagonWheel || [];
    match.wagonWheel.push({
      outcome,
      angle: shotAngle,
      length: shotLength,
      runs: runsAdded,
    });
  }

  const commentary = compileHinglishCommentary(
    outcome,
    match.commentaryStyle,
    match.scenario,
    match.striker,
    match.strikerStyle,
    match.bowler,
    customShotText
  );

  const ballNo = `${Math.floor(match.overs)}.${match.ballsInOver}`;
  const feedItem = {
    outcome,
    text: commentary,
    ballNo,
    batsman: match.striker,
    bowler: match.bowler,
    createdAt: new Date(),
  };

  match.feedHistory = [feedItem, ...(match.feedHistory || [])].slice(0, 50);
  match.feedCount = (match.feedCount || 0) + 1;
  match.latestCommentary = commentary;

  const victory = checkVictory(match);
  if (victory.status) match.status = victory.status;

  return {
    match,
    commentary,
    outcome,
    runsAdded,
    ballLog: {
      matchScenario: match.scenario,
      ballNumber: ballNo,
      striker: match.striker,
      bowler: match.bowler,
      ballOutcome: outcome,
      runsAdded,
      isExtra: outcome === "EXTRA",
    },
    victory: victory.ended
      ? { title: victory.title, message: victory.message }
      : null,
  };
}

export function resetMatch(match, scenario = match.scenario) {
  const defaults = getScenarioDefaults(scenario);
  Object.assign(match, defaults, {
    feedHistory: [],
    feedCount: 0,
    wagonWheel: [],
    status: "active",
    latestCommentary: `CricAI arena configured for ${scenario}! Bowl a delivery to broadcast live.`,
  });
  return match;
}

export function calcBattingShotOutcome(shotType, striker, bowler) {
  let roll = Math.random() * 100;
  let outcome = "DOT";
  let shotText = "";

  if (shotType === "helicopter") {
    shotText = "mighty Helicopter Shot";
    let sixThreshold = striker === "MS Dhoni" ? 65 : 40;
    let wicketThreshold = striker === "MS Dhoni" ? 10 : 20;
    if (bowler === "Jasprit Bumrah") {
      sixThreshold -= 15;
      wicketThreshold += 15;
    }
    if (roll < sixThreshold) outcome = "SIX";
    else if (roll < sixThreshold + 15) outcome = "FOUR";
    else if (roll < sixThreshold + 15 + wicketThreshold) outcome = "WICKET";
    else if (roll < sixThreshold + 15 + wicketThreshold + 15) outcome = "RUNS";
  } else if (shotType === "coverdrive") {
    shotText = "stunning Cover Drive";
    let fourThreshold = striker === "Virat Kohli" ? 60 : 35;
    let wicketThreshold = striker === "Virat Kohli" ? 5 : 10;
    if (roll < fourThreshold) outcome = "FOUR";
    else if (roll < fourThreshold + 30) outcome = "RUNS";
    else if (roll < fourThreshold + 30 + wicketThreshold) outcome = "WICKET";
    else if (roll < fourThreshold + 30 + wicketThreshold + 5) outcome = "SIX";
  } else if (shotType === "nudge") {
    shotText = "smart Nudge & Run";
    if (roll < 70) outcome = "RUNS";
    else if (roll < 92) outcome = "DOT";
    else outcome = "WICKET";
  } else {
    shotText = "tactical Leave";
    outcome = roll < 18 ? "EXTRA" : "DOT";
  }

  return { outcome, shotText };
}
