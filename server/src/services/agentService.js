/**
 * agentService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The core Gemini-powered agentic loop.
 *
 * Flow for every chat message:
 *   1. Build system prompt  (match context injected as live state)
 *   2. Start / resume multi-turn chat session with conversation history
 *   3. Send user message → Gemini responds with text OR tool_call(s)
 *   4. If tool_call → execute tool → mutate match → feed result back to Gemini
 *   5. Repeat until Gemini responds with plain text (no more tool calls)
 *   6. Return final Hinglish reply + list of actions taken
 *
 * Falls back gracefully to the legacy NLP keyword agent if GEMINI_API_KEY
 * is not set, so the app never crashes without a key.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getToolDeclarations, executeTool } from "./agentTools.js";
import {
  getHistory,
  pushUserTurn,
  pushModelTurn,
  clearHistory,
} from "./agentMemory.js";
import { parseAgentIntent } from "./nlpAgent.js"; // legacy fallback
import { applyBall } from "./matchLogic.js"; // used in legacy fallback

// ─── Gemini client (lazy-init so missing key doesn't crash import) ─────────────
let genAI = null;
let model = null;

function getModel() {
  if (model) return model;
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  genAI = new GoogleGenerativeAI(key);
  model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ functionDeclarations: getToolDeclarations() }],
    toolConfig: { functionCallingConfig: { mode: "AUTO" } },
  });
  return model;
}

// ─── System Prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(match) {
  const runsNeeded = Math.max(0, match.target - match.score);
  const totalBalls = Math.floor(match.overs) * 6 + (match.ballsInOver || 0);
  const ballsLeft = Math.max(0, 120 - totalBalls);

  return `You are CricAI Copilot — an expert, high-energy Hinglish cricket commentator and AI match assistant.

## LIVE MATCH STATE
- Striker (batsman): ${match.striker} [${match.strikerStyle}]
- Bowler: ${match.bowler}
- Score: ${match.score}/${match.wickets} | Target: ${match.target}
- Overs: ${match.overs} | Balls left: ${ballsLeft}
- Runs needed: ${runsNeeded}
- Scenario: ${match.scenario}
- Commentary tone: ${match.commentaryStyle}
- Match status: ${match.status}

## YOUR PERSONALITY
- Speak in lively Hinglish (mix of Hindi + English) like a desi IPL commentator
- Use cricket slang, Bollywood references, emojis 🏏🔥💥
- Be dramatic, funny, sarcastic or aggressive based on tone
- Keep responses SHORT and punchy (2-4 lines max) — stadium energy!
- Always use the tools to take real actions (bowl, stats, reset, etc.)
- After using a tool, describe what happened in Hinglish with flair

## RULES
- ALWAYS call the right tool before responding — don't just describe actions, DO them
- If the user asks about a player + action (Dhoni six), call bowl_ball AND set_player
- If user asks for stats/win probability, call get_stats and return the numbers with commentary
- If user resets, call reset_match AND clear your mental state
- Never make up scores — always use tool results for accurate data
- If match is over (status != active), tell the user dramatically and suggest reset`;
}

// ─── Main Agent Function ──────────────────────────────────────────────────────
/**
 * Run the agentic loop for one user message.
 *
 * @param {string}  matchId   - Match identifier (for memory lookup)
 * @param {string}  userText  - Raw user message
 * @param {object}  match     - Live match object (mutated by tools)
 * @returns {Promise<{reply: string, actions: object[], sfx: string|null, match: object}>}
 */
export async function runAgent(matchId, userText, match) {
  const m = getModel();

  // ── FALLBACK: no API key → legacy keyword NLP ─────────────────────────────
  if (!m) {
    console.warn("[CricAI Agent] No GEMINI_API_KEY — using legacy NLP fallback");
    return legacyFallback(userText, match);
  }

  const actions = [];
  let sfx = null;

  try {
    // ── 1. Build chat session with existing history ───────────────────────────
    const history = getHistory(matchId);
    const systemInstruction = buildSystemPrompt(match);

    const chat = m.startChat({
      history,
      systemInstruction,
    });

    // ── 2. Send user message ──────────────────────────────────────────────────
    pushUserTurn(matchId, userText);
    let response = await chat.sendMessage(userText);
    let candidate = response.response;

    // ── 3. Agentic tool-call loop (max 8 rounds to prevent infinite loops) ────
    let rounds = 0;
    while (rounds < 8) {
      const functionCalls = candidate.functionCalls?.();
      if (!functionCalls || functionCalls.length === 0) break; // no more tools

      // Execute every tool call Gemini requested in this round
      const toolResults = [];
      for (const fc of functionCalls) {
        const toolName = fc.name;
        const toolArgs = fc.args || {};

        console.log(`[CricAI Agent] Tool call: ${toolName}`, toolArgs);
        const result = executeTool(toolName, toolArgs, match);

        // Side-effects
        if (toolName === "reset_match") clearHistory(matchId);
        if (toolName === "play_sfx" && result.sfx) sfx = result.sfx;

        actions.push({ tool: toolName, args: toolArgs, result });
        toolResults.push({
          functionResponse: {
            name: toolName,
            response: result,
          },
        });
      }

      // Feed all results back to Gemini
      response = await chat.sendMessage(toolResults);
      candidate = response.response;
      rounds++;
    }

    // ── 4. Extract final text reply ───────────────────────────────────────────
    const finalText =
      candidate.text?.() ||
      candidate.candidates?.[0]?.content?.parts
        ?.filter((p) => p.text)
        .map((p) => p.text)
        .join("") ||
      "🤖 CricAI ready! Bowl karo, stats maango, ya koi bhi shot khelo!";

    pushModelTurn(matchId, finalText);

    return { reply: finalText, actions, sfx, match };
  } catch (err) {
    console.error("[CricAI Agent] Gemini error:", err.message);

    // Graceful degradation — try legacy NLP
    const fallback = legacyFallback(userText, match);
    return {
      ...fallback,
      reply: `⚡ CricAI Copilot (fallback mode): ${fallback.reply}`,
    };
  }
}

// ─── Legacy NLP Fallback (original keyword matching) ──────────────────────────
function legacyFallback(userText, match) {
  const { reply, action, updates } = parseAgentIntent(userText);
  Object.assign(match, updates);

  const actions = [];
  let sfx = null;

  if (action?.type === "sfx") {
    sfx = action.sound;
    actions.push({ tool: "play_sfx", args: { sound: action.sound } });
  } else if (action?.type === "bowl") {
    const result = applyBall(match, action.outcome);
    actions.push({ tool: "bowl_ball", args: { outcome: action.outcome }, result });
  }

  return { reply, actions, sfx, match };
}
