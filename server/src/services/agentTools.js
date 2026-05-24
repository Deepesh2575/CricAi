/**
 * agentTools.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Defines every tool the Gemini agent can invoke during a chat turn.
 * Each entry has:
 *   • declaration  – sent to Gemini as a FunctionDeclaration
 *   • execute(args, match) – runs the actual logic and returns a result object
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  applyBall,
  resetMatch,
  formatStatsReply,
  getWinProbabilities,
  calcBattingShotOutcome,
} from "./matchLogic.js";

// ─── Tool: bowl_ball ──────────────────────────────────────────────────────────
const bowlBall = {
  declaration: {
    name: "bowl_ball",
    description:
      "Bowl one delivery and update the live scoreboard. Use this whenever the user asks for a six, four, wicket, dot ball, wide/no-ball, or any run outcome. Also use when the user says to play a shot by name (helicopter, cover drive, nudge).",
    parameters: {
      type: "object",
      properties: {
        outcome: {
          type: "string",
          enum: ["SIX", "FOUR", "WICKET", "DOT", "RUNS", "EXTRA"],
          description:
            "Outcome of the delivery. Use EXTRA for wide/no-ball, RUNS for 1-3 runs.",
        },
        shotType: {
          type: "string",
          enum: ["helicopter", "coverdrive", "nudge", "leave"],
          description:
            "Optional named batting shot. When provided, the outcome is calculated probabilistically based on striker vs bowler matchup.",
        },
        customRuns: {
          type: "number",
          description: "Exact runs to add when outcome is RUNS (1-3).",
        },
      },
      required: ["outcome"],
    },
  },
  execute(args, match) {
    let { outcome, shotType, customRuns } = args;
    let customShotText = "";

    if (shotType) {
      const shot = calcBattingShotOutcome(shotType, match.striker, match.bowler);
      outcome = shot.outcome;
      customShotText = shot.shotText;
    }

    const result = applyBall(match, outcome, { customShotText, customRuns });
    return {
      success: !result.error,
      error: result.error || null,
      outcome: result.outcome,
      runsAdded: result.runsAdded,
      commentary: result.commentary,
      score: result.match.score,
      wickets: result.match.wickets,
      overs: result.match.overs,
      victory: result.victory || null,
      probabilities: getWinProbabilities(result.match),
    };
  },
};

// ─── Tool: reset_match ────────────────────────────────────────────────────────
const resetMatchTool = {
  declaration: {
    name: "reset_match",
    description:
      "Reset the scoreboard and start a fresh match. Use when the user says 'reset', 'naya match', 'start over', 'new game'.",
    parameters: {
      type: "object",
      properties: {
        scenario: {
          type: "string",
          enum: ["powerplay", "middle", "death", "lastball"],
          description: "Which match scenario to load after reset.",
        },
      },
      required: [],
    },
  },
  execute(args, match) {
    const scenario = args.scenario || match.scenario || "death";
    resetMatch(match, scenario);
    return {
      success: true,
      message: `Match reset! Scenario: ${scenario}`,
      scenario,
      score: match.score,
      wickets: match.wickets,
      target: match.target,
    };
  },
};

// ─── Tool: get_stats ──────────────────────────────────────────────────────────
const getStats = {
  declaration: {
    name: "get_stats",
    description:
      "Fetch current match analytics: win probability, required run rate, runs needed, balls left. Use when user asks 'kya lagta hai', 'win probability', 'kitne chahiye', 'stats', 'chances'.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  execute(_args, match) {
    const probs = getWinProbabilities(match);
    const runsNeeded = Math.max(0, match.target - match.score);
    const totalBalls = Math.floor(match.overs) * 6 + match.ballsInOver;
    const ballsLeft = Math.max(1, 120 - totalBalls);
    const rrr = ((runsNeeded / ballsLeft) * 6).toFixed(2);
    return {
      battingWinProb: probs.batting.toFixed(1),
      bowlingWinProb: probs.bowling.toFixed(1),
      score: `${match.score}/${match.wickets}`,
      target: match.target,
      runsNeeded,
      ballsLeft,
      requiredRunRate: rrr,
      overs: match.overs,
    };
  },
};

// ─── Tool: set_player ─────────────────────────────────────────────────────────
const setPlayer = {
  declaration: {
    name: "set_player",
    description:
      "Change the striker (batsman) or bowler on the field. Use when user says a player name in context of batting or bowling, e.g. 'Kohli batting hai', 'Bumrah bowl karo'.",
    parameters: {
      type: "object",
      properties: {
        striker: {
          type: "string",
          description: "Full name of the batsman now on strike.",
        },
        strikerStyle: {
          type: "string",
          enum: ["Aggressive hitter", "Anchor", "Newcomer"],
          description: "Batting style of the striker.",
        },
        bowler: {
          type: "string",
          description: "Full name of the bowler.",
        },
      },
      required: [],
    },
  },
  execute(args, match) {
    if (args.striker) {
      match.striker = args.striker;
      match.strikerStyle = args.strikerStyle || match.strikerStyle;
    }
    if (args.bowler) match.bowler = args.bowler;
    return {
      success: true,
      striker: match.striker,
      strikerStyle: match.strikerStyle,
      bowler: match.bowler,
    };
  },
};

// ─── Tool: set_commentary_tone ────────────────────────────────────────────────
const setTone = {
  declaration: {
    name: "set_commentary_tone",
    description:
      "Switch the Hinglish commentary style. Use when user asks for 'filmy', 'sarcastic', or 'aggressive' commentary.",
    parameters: {
      type: "object",
      properties: {
        style: {
          type: "string",
          enum: ["filmy", "sarcastic", "aggressive"],
          description: "Commentary tone to activate.",
        },
      },
      required: ["style"],
    },
  },
  execute(args, match) {
    match.commentaryStyle = args.style;
    return {
      success: true,
      commentaryStyle: match.commentaryStyle,
      message: `Commentary tone switched to: ${args.style}`,
    };
  },
};

// ─── Tool: play_sfx ───────────────────────────────────────────────────────────
const playSfx = {
  declaration: {
    name: "play_sfx",
    description:
      "Trigger a stadium sound effect on the client. Use when user asks for dhol, crowd roar, IPL trumpet/horn, or any stadium SFX.",
    parameters: {
      type: "object",
      properties: {
        sound: {
          type: "string",
          enum: ["dhol", "horn", "cheer", "wicket_bell"],
          description: "Which sound effect to play in the stadium.",
        },
      },
      required: ["sound"],
    },
  },
  execute(args, _match) {
    return {
      success: true,
      sfx: args.sound,
      message: `SFX triggered: ${args.sound}`,
    };
  },
};

// ─── Tool: set_scenario ───────────────────────────────────────────────────────
const setScenario = {
  declaration: {
    name: "set_scenario",
    description:
      "Change the match scenario (powerplay / middle overs / death overs / last ball). Use when user asks to load a different game situation.",
    parameters: {
      type: "object",
      properties: {
        scenario: {
          type: "string",
          enum: ["powerplay", "middle", "death", "lastball"],
        },
      },
      required: ["scenario"],
    },
  },
  execute(args, match) {
    match.scenario = args.scenario;
    return {
      success: true,
      scenario: match.scenario,
      message: `Scenario changed to: ${args.scenario}`,
    };
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────
export const ALL_TOOLS = [
  bowlBall,
  resetMatchTool,
  getStats,
  setPlayer,
  setTone,
  playSfx,
  setScenario,
];

/** Returns just the Gemini FunctionDeclarations array */
export function getToolDeclarations() {
  return ALL_TOOLS.map((t) => t.declaration);
}

/** Executes a tool by name, mutates match, returns result object */
export function executeTool(name, args, match) {
  const tool = ALL_TOOLS.find((t) => t.declaration.name === name);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${name}` };
  }
  try {
    return tool.execute(args, match);
  } catch (err) {
    return { success: false, error: err.message };
  }
}
