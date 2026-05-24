import { Router } from "express";
import { listVoiceLanguages, synthesizeSpeech } from "../services/ttsService.js";

const router = Router();

router.get("/languages", (_req, res) => {
  res.json({ ok: true, languages: listVoiceLanguages() });
});

router.post("/speak", async (req, res, next) => {
  try {
    const { text, languageId = "hinglish", outcome } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ ok: false, error: "text is required" });
    }

    const audio = await synthesizeSpeech(text, languageId, outcome);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(audio);
  } catch (err) {
    console.error("TTS error:", err.message);
    next(err);
  }
});

export default router;
