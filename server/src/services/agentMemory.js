/**
 * agentMemory.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-match conversation history for the Gemini multi-turn agent.
 * Stored in-process (resets on server restart — good enough for hackathon).
 * For production you'd persist this in MongoDB alongside the Match document.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Map<matchId, Content[]>  (Gemini Content format) */
const store = new Map();

const MAX_TURNS = 20; // keep last 20 user+model pairs to avoid token bloat

/**
 * Get the history array for a match (creates empty if first time).
 * @param {string} matchId
 * @returns {import("@google/generative-ai").Content[]}
 */
export function getHistory(matchId) {
  if (!store.has(matchId)) store.set(matchId, []);
  return store.get(matchId);
}

/**
 * Append a user turn to history.
 * @param {string} matchId
 * @param {string} text
 */
export function pushUserTurn(matchId, text) {
  const history = getHistory(matchId);
  history.push({ role: "user", parts: [{ text }] });
  trim(matchId);
}

/**
 * Append a model turn to history.
 * @param {string} matchId
 * @param {string} text
 */
export function pushModelTurn(matchId, text) {
  const history = getHistory(matchId);
  history.push({ role: "model", parts: [{ text }] });
  trim(matchId);
}

/**
 * Wipe history for a match (called after reset_match tool fires).
 * @param {string} matchId
 */
export function clearHistory(matchId) {
  store.set(matchId, []);
}

/** Keep only the last MAX_TURNS×2 entries (user+model pairs) */
function trim(matchId) {
  const history = getHistory(matchId);
  const maxEntries = MAX_TURNS * 2;
  if (history.length > maxEntries) {
    store.set(matchId, history.slice(history.length - maxEntries));
  }
}
