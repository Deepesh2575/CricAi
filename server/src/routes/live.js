import { Router } from "express";
import {
  DEMO_LIVE_TIMELINE,
  fetchLiveMatches,
  parseESPNLiveTitle,
} from "../services/liveFeed.js";

const router = Router();

router.get("/matches", async (_req, res, next) => {
  try {
    const matches = await fetchLiveMatches();
    res.json({ ok: true, matches });
  } catch (err) {
    res.json({
      ok: false,
      matches: [],
      error: err.message,
      fallback: "Use demo feed",
    });
  }
});

router.get("/demo-timeline", (_req, res) => {
  res.json({ ok: true, timeline: DEMO_LIVE_TIMELINE });
});

router.post("/parse-title", (req, res) => {
  const parsed = parseESPNLiveTitle(req.body.title || "");
  res.json({ ok: !!parsed, parsed });
});

export default router;
