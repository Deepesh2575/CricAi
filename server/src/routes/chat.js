/**
 * chat.js — Agentic chat route
 * POST /api/chat/:matchId   { message: string }
 *
 * Delegates to the Gemini-powered agentService (with NLP fallback).
 * Returns the reply, list of tool actions taken, match state, and optional SFX.
 */

import { Router } from "express";
import { getMatchById, saveMatch } from "../repositories/matchRepository.js";
import { runAgent } from "../services/agentService.js";
import { formatStatsReply } from "../services/matchLogic.js";

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

    // ── Run the agentic loop ──────────────────────────────────────────────────
    const { reply, actions, sfx } = await runAgent(
      req.params.matchId,
      message,
      match
    );

    // Persist mutated match state
    const saved = await saveMatch(match);

    // Pull out bowl result + victory from actions (if any bowl_ball was called)
    const bowlAction = actions.find((a) => a.tool === "bowl_ball");
    const statsAction = actions.find((a) => a.tool === "get_stats");

    res.json({
      ok: true,
      reply,
      // Legacy-compatible fields so the existing React UI keeps working
      action: bowlAction
        ? { type: "bowl", outcome: bowlAction.result?.outcome }
        : statsAction
        ? { type: "stats" }
        : actions[0]
        ? { type: actions[0].tool, ...actions[0].args }
        : null,
      ballResult: bowlAction?.result
        ? {
            commentary: bowlAction.result.commentary,
            outcome: bowlAction.result.outcome,
            victory: bowlAction.result.victory,
          }
        : null,
      // New agentic fields
      agentActions: actions,
      sfx: sfx || null,
      match: saved,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
