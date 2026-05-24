import { Router } from "express";
import { listVoiceLanguages, synthesizeSpeech } from "../services/ttsService.js";

const router = Router();

router.get("/languages", (_req, res) => {
  const languages = listVoiceLanguages();
  res.json({ 
    ok: true, 
    languages,
    count: languages.length,
    defaultLanguage: "hinglish"
  });
});

router.post("/speak", async (req, res, next) => {
  try {
    const { text, languageId = "hinglish", outcome } = req.body;
    
    if (!text?.trim()) {
      return res.status(400).json({ 
        ok: false, 
        error: "text is required" 
      });
    }

    if (!text.trim().length) {
      return res.status(400).json({ 
        ok: false, 
        error: "text cannot be empty" 
      });
    }

    console.log(`TTS Request: language=${languageId}, outcome=${outcome}, textLength=${text.length}`);

    const audio = await synthesizeSpeech(text, languageId, outcome);
    
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", audio.length);
    res.send(audio);
    
    console.log(`TTS Response: Sent ${audio.length} bytes for ${languageId}`);
  } catch (err) {
    console.error("TTS endpoint error:", err.message);
    res.status(500).json({ 
      ok: false, 
      error: err.message || "TTS synthesis failed"
    });
  }
});

export default router;
