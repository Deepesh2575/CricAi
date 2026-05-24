/**
 * live.js — Live scores route
 *
 * GET /api/live/stream       ← SSE stream of real CricAPI match events
 * GET /api/live/matches      ← REST snapshot of all live matches
 * GET /api/live/demo-timeline  ← legacy demo array (kept for compat)
 * POST /api/live/parse-title   ← legacy helper
 */

import { Router } from "express";
import {
  DEMO_LIVE_TIMELINE,
  fetchLiveMatches,
  parseESPNLiveTitle,
} from "../services/liveFeed.js";
import {
  liveSSEManager,
  fetchCricApiMatches,
  normaliseCricApiMatch,
} from "../services/liveScoreService.js";

const router = Router();

// ─── SSE stream — real-time match events ─────────────────────────────────────
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Connected confirmation
  res.write(`event: connected\ndata: ${JSON.stringify({
    message: "CricAI Live SSE connected",
    hasKey: !!process.env.CRICAPI_KEY,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  liveSSEManager.addClient(res);
});

// ─── REST: snapshot of all live matches ──────────────────────────────────────
router.get("/matches", async (_req, res) => {
  const apiKey = process.env.CRICAPI_KEY;

  if (!apiKey) {
    // Automatically fall back to ESPN Cricinfo RSS matches list!
    try {
      const matches = await fetchLiveMatches();
      return res.json({ ok: true, matches, source: "espn-rss", count: matches.length });
    } catch (err) {
      return res.json({ ok: false, matches: [], error: "No CRICAPI_KEY set and ESPN RSS load failed: " + err.message });
    }
  }

  try {
    const raw = await fetchCricApiMatches(apiKey);
    const matches = raw.map(normaliseCricApiMatch);
    res.json({ ok: true, matches, count: matches.length, source: "real" });
  } catch (err) {
    // ESPN RSS as last resort
    try {
      const matches = await fetchLiveMatches();
      res.json({ ok: true, matches, source: "espn-rss", count: matches.length });
    } catch (err2) {
      res.json({ ok: false, matches: [], error: err.message + " | ESPN RSS error: " + err2.message });
    }
  }
});

// ─── Legacy endpoints ─────────────────────────────────────────────────────────
router.get("/demo-timeline", (_req, res) => {
  res.json({ ok: true, timeline: DEMO_LIVE_TIMELINE });
});

router.post("/parse-title", (req, res) => {
  const parsed = parseESPNLiveTitle(req.body.title || "");
  res.json({ ok: !!parsed, parsed });
});

export default router;
