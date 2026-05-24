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
import { VOICE_LANGUAGES } from "./voiceLanguages.js";

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
    tools: [
      { functionDeclarations: getToolDeclarations() },
      { googleSearch: {} }
    ],
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

## YOUR PERSONALITY & WEB SEARCH GROUNDING
- Speak in lively Hinglish (mix of Hindi + English) like a desi IPL commentator
- Use cricket slang, Bollywood references, emojis 🏏🔥💥
- Be dramatic, funny, sarcastic or aggressive based on tone
- Keep responses SHORT and punchy (2-4 lines max) — stadium energy!
- **GOOGLE SEARCH GROUNDING**: If the user asks about any real-world match (e.g. "India vs Pakistan score", "RCB vs CSK live", "IPL match score today") or asks you to fetch live stats from Google, Cricinfo, or ESPN, **always use your Google Search tool** to look up the latest live scores/details, then provide high-energy, exciting live commentary based on the real search results!
- Always use the tools to take real actions (bowl, stats, reset, etc.)
- After using a tool or performing a web search, describe what happened in Hinglish with flair

## RULES
- ALWAYS call the right tool before responding — don't just describe actions, DO them
- If the user asks about a player + action (Dhoni six), call bowl_ball AND set_player
- If user asks for stats/win probability, call get_stats and return the numbers with commentary
- If user resets, call reset_match AND clear your mental state
- Never make up scores — always use tool results or real web search grounding for accurate data
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

/**
 * Fetch the actual real-world commentary directly from the Cricinfo Next.js data block.
 */
export async function fetchRealCricinfoCommentary(matchGuid) {
  if (!matchGuid || typeof matchGuid !== "string") return null;
  try {
    // Extract matchId. URL format: http://www.cricinfo.com/ci/engine/match/1529312.html -> 1529312
    const match = matchGuid.match(/match\/(\d+)/);
    if (!match) return null;
    const matchId = match[1];

    const url = `http://www.cricinfo.com/ci/engine/match/${matchId}.html`;
    console.log(`[Cricinfo Fetch] Fetching live HTML from: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      console.warn(`[Cricinfo Fetch] Failed to fetch HTML: ${res.status}`);
      return null;
    }

    const html = await res.text();
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      console.warn("[Cricinfo Fetch] Could not find __NEXT_DATA__ script block");
      return null;
    }

    const data = JSON.parse(scriptMatch[1].trim());
    const ballComments = data?.props?.appPageProps?.data?.data?.content?.recentBallCommentary?.ballComments;
    
    if (ballComments && ballComments.length > 0) {
      const latest = ballComments[0];
      const title = latest.title || "";
      const textItems = latest.commentTextItems || [];
      const htmlText = textItems.map(item => item.html || item.text || "").join(" ");
      
      // Clean HTML tags from commentary text
      const cleanText = htmlText.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      
      if (cleanText) {
        console.log(`[Cricinfo Fetch] Successfully fetched live ball commentary: "${cleanText}"`);
        return {
          title,
          commentary: cleanText,
          runs: latest.totalRuns || latest.batsmanRuns || 0,
          isWicket: !!latest.isWicket,
          isSix: !!latest.isSix,
          isFour: !!latest.isFour,
          oversActual: latest.oversActual,
          totalInningRuns: latest.totalInningRuns || 0,
          totalInningWickets: latest.totalInningWickets || 0,
        };
      }
    }
    
    console.warn("[Cricinfo Fetch] No recent ball comments found in state");
    return null;
  } catch (err) {
    console.error("[Cricinfo Fetch] Error fetching live commentary:", err.message);
    return null;
  }
}

/**
 * Generate real-world live match commentary from Google search grounding and translate it.
 */
export async function generateLiveMatchCommentary({ desc, score, wickets, overs, commentaryStyle, languageId, matchGuid }) {
  // 1. Fetch real commentary from Cricinfo page
  const realComm = await fetchRealCricinfoCommentary(matchGuid);
  
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // If no key, return real cricinfo commentary directly!
    if (realComm) {
      return `${realComm.title}: ${realComm.commentary}`;
    }
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }],
    });

    const langLabel = VOICE_LANGUAGES[languageId]?.label || "Hinglish (Hindi + English mix)";

    let prompt = "";
    if (realComm) {
      prompt = `The user is watching a live cricket match.
Actual delivery action: "${realComm.title}"
Real-world ball-by-ball description: "${realComm.commentary}"
Runs scored on this ball: ${realComm.runs} (Six: ${realComm.isSix}, Four: ${realComm.isFour}, Wicket: ${realComm.isWicket})
Current Score: ${score}/${wickets} in ${overs} overs.
Chosen Language: ${langLabel}
Commentary Style/Tone: ${commentaryStyle} (e.g. filmy / sarcastic / aggressive)

Instructions:
1. Adapt and translate this ACTUAL real-world ball action ("${realComm.commentary}") into the chosen language "${langLabel}" with the chosen commentary style "${commentaryStyle}".
2. Make it extremely exciting, high-energy, and natural (as if spoken by an energetic live commentator at the stadium!).
3. Describe the actual players and action (e.g., if it says "${realComm.title}", mention these players!).
4. Return ONLY the translated, high-energy commentary text (2-3 lines max). Do not include system labels, markdown formatting, markdown bold (* or **), or JSON wrappers. Just the commentary itself.`;
    } else {
      prompt = `The user is watching a live cricket match.
Context: "${desc}"
Current Score: ${score}/${wickets} in ${overs} overs.
Chosen Language: ${langLabel}
Commentary Style/Tone: ${commentaryStyle} (e.g. filmy / sarcastic / aggressive)

Instructions:
1. Use your Google Search tool to search for the latest live ball-by-ball commentary or live match details for this specific match (e.g., search for "${desc} live score cricinfo").
2. Find the absolute latest delivery/ball-by-ball action (who bowled, who batted, what was the shot, runs scored, or wicket).
3. Translate this real-world latest ball action into the chosen language "${langLabel}" with the chosen commentary style "${commentaryStyle}".
4. Make it extremely exciting, high-energy, and natural (as if spoken by an energetic live commentator at the stadium!).
5. Do NOT make up fake events—you MUST describe the actual latest event from your live search results!
6. Return ONLY the translated, high-energy commentary text (2-3 lines max). Do not include system labels, markdown formatting, markdown bold (* or **), or JSON wrappers. Just the commentary itself.`;
    }

    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (err) {
    console.error("Error generating live match search commentary:", err.message);
    
    // If Gemini fails (e.g. 429 Quota Exceeded), fall back to the actual real-world cricinfo commentary!
    if (realComm) {
      console.log("[Cricinfo Fallback] Gemini failed/quota exceeded, falling back to raw real-world commentary.");
      return `${realComm.title}: ${realComm.commentary}`;
    }
    return null;
  }
}
