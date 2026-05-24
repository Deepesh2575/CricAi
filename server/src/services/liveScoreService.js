/**
 * liveScoreService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches REAL live international + domestic cricket matches from CricAPI
 * (cricketdata.org — free: 100 req/day).
 *
 * Requires CRICAPI_KEY in server/.env.
 * Without a key, the SSE stream emits a "no_key" event and nothing else.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CRICAPI_BASE = "https://api.cricapi.com/v1";
const POLL_INTERVAL_MS = 30_000; // 30s — conserves free-tier quota (100/day)

// ─── CricAPI helpers ──────────────────────────────────────────────────────────

/** Fetch all currently live matches */
export async function fetchCricApiMatches(apiKey) {
  const url = `${CRICAPI_BASE}/currentMatches?apikey=${apiKey}&offset=0`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`CricAPI HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.reason || "CricAPI non-success");
  // Return only matches that have started and are not finished
  return (json.data || []).filter((m) => m.matchStarted && !m.matchEnded);
}

/** Fetch full detail for one match (includes ball-by-ball scorecard if available) */
export async function fetchCricApiMatchDetail(apiKey, matchId) {
  const url = `${CRICAPI_BASE}/match_info?apikey=${apiKey}&id=${matchId}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`CricAPI detail HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error(json.reason || "CricAPI detail non-success");
  return json.data;
}

/** Normalise a CricAPI match into a clean, flat shape for the UI */
export function normaliseCricApiMatch(m) {
  const scores = m.score || [];

  // Build per-innings score array
  const innings = scores.map((s) => ({
    inning: s.inning || "",
    runs: s.r ?? 0,
    wickets: s.w ?? 0,
    overs: s.o ?? 0,
  }));

  // Latest batting innings = last item in array
  const latest = innings[innings.length - 1] || {};

  return {
    id: m.id,
    name: m.name || "Live Match",
    shortName: m.teams ? m.teams.join(" vs ") : "Match",
    matchType: m.matchType || "T20",
    status: m.status || "",
    venue: m.venue || "",
    dateTimeGMT: m.dateTimeGMT || "",
    teams: m.teams || [],
    innings,
    // Convenience fields for the latest batting innings
    score: latest.runs || 0,
    wickets: latest.wickets || 0,
    overs: latest.overs || 0,
    currentInning: latest.inning || "",
    isSimulated: false,
  };
}

// ─── SSE Manager ──────────────────────────────────────────────────────────────
class LiveSSEManager {
  constructor() {
    this.clients  = new Set();
    this.timer    = null;
    this.cache    = [];      // last known live matches
    this.lastFetch = 0;
  }

  addClient(res) {
    this.clients.add(res);
    console.log(`[LiveSSE] +client  total=${this.clients.size}`);

    // Immediately send current cached state or no_key notice
    const apiKey = process.env.CRICAPI_KEY;
    if (!apiKey) {
      this._send(res, "no_key", {
        message: "Add CRICAPI_KEY to server/.env to stream real live matches.",
        link: "https://www.cricketdata.org/",
      });
    } else if (this.cache.length > 0) {
      this._send(res, "live_matches", { matches: this.cache, source: "real" });
    }

    if (this.clients.size === 1) this._startPolling();

    res.on("close", () => {
      this.clients.delete(res);
      console.log(`[LiveSSE] -client  total=${this.clients.size}`);
      if (this.clients.size === 0) this._stopPolling();
    });
  }

  /** Send one SSE event to a single response */
  _send(res, event, data) {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch { /* client gone */ }
  }

  /** Broadcast one SSE event to ALL connected clients */
  _broadcast(event, data) {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try { client.write(msg); }
      catch { this.clients.delete(client); }
    }
  }

  async _poll() {
    const apiKey = process.env.CRICAPI_KEY;
    if (!apiKey) {
      this._broadcast("no_key", {
        message: "No CRICAPI_KEY set. Add it to server/.env.",
        link: "https://www.cricketdata.org/",
      });
      return;
    }

    try {
      const raw = await fetchCricApiMatches(apiKey);
      const matches = raw.map(normaliseCricApiMatch);
      this.cache = matches;
      this.lastFetch = Date.now();

      this._broadcast("live_matches", {
        matches,
        count: matches.length,
        source: "real",
        timestamp: new Date().toISOString(),
      });

      // Per-match score_update events
      for (const m of matches) {
        this._broadcast("score_update", {
          matchId: m.id,
          name: m.name,
          shortName: m.shortName,
          innings: m.innings,
          score: m.score,
          wickets: m.wickets,
          overs: m.overs,
          status: m.status,
          matchType: m.matchType,
          source: "real",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("[LiveSSE] CricAPI poll error:", err.message);
      this._broadcast("error", { message: err.message });
    }
  }

  _startPolling() {
    this._poll(); // immediate first poll
    this.timer = setInterval(() => this._poll(), POLL_INTERVAL_MS);
  }

  _stopPolling() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

export const liveSSEManager = new LiveSSEManager();
