import { EdgeTTS } from "node-edge-tts";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import {
  VOICE_LANGUAGES,
  cleanTextForSpeech,
  getOutcomeSpeechModifiers,
} from "./voiceLanguages.js";

/**
 * Translate text to the target language code using a free Google Translate single endpoint.
 */
export async function translateText(text, targetLangCode) {
  if (!text || !targetLangCode) return text;
  
  // If target language is English, no translation is needed
  if (targetLangCode.startsWith("en")) return text;
  
  try {
    const cleanLangCode = targetLangCode.split("-")[0]; // e.g. hi-IN -> hi
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${cleanLangCode}&dt=t&q=${encodeURIComponent(text)}`;
    
    console.log(`[Translator] Translating live commentary to "${cleanLangCode}" using public Translate API...`);
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const translated = json?.[0]?.map(sentence => sentence?.[0] || "").join("").trim();
      if (translated) {
        console.log(`[Translator] Translated text successfully: "${translated}"`);
        return translated;
      }
    }
  } catch (err) {
    console.warn(`[Translator] Translation failed fallback to original text: ${err.message}`);
  }
  return text;
}

export async function synthesizeSpeech(text, languageId = "hinglish", outcome) {
  try {
    const config = VOICE_LANGUAGES[languageId] || VOICE_LANGUAGES.hinglish;
    
    // Auto-translate live cricinfo English commentary to the chosen voice language
    let speechText = text;
    if (config.lang && !config.lang.startsWith("en")) {
      speechText = await translateText(text, config.lang);
    }
    
    const cleaned = cleanTextForSpeech(speechText);
    
    if (!cleaned) {
      throw new Error("No text to speak after cleaning");
    }

    const mods = getOutcomeSpeechModifiers(outcome);
    const tmpFile = path.join(os.tmpdir(), `cricai-tts-${randomUUID()}.mp3`);

    console.log(`TTS: Synthesizing for ${languageId} (${config.voice}), length: ${cleaned.length}`);

    const tts = new EdgeTTS({
      voice: config.voice,
      lang: config.lang,
      rate: mods.rate,
      pitch: mods.pitch,
      timeout: 20000,
    });

    await tts.ttsPromise(cleaned.slice(0, 900), tmpFile);
    const buffer = await fs.readFile(tmpFile);
    
    console.log(`TTS: Successfully generated audio (${buffer.length} bytes) for ${languageId}`);
    
    return buffer;
  } catch (err) {
    console.error(`TTS Error for language ${languageId}:`, err.message);
    throw new Error(`Text-to-speech synthesis failed: ${err.message}`);
  } finally {
    const tmpFile = path.join(os.tmpdir(), `cricai-tts-*.mp3`);
    try {
      // Clean up temp files (basic cleanup)
      const files = await fs.readdir(os.tmpdir());
      const ttsFiles = files.filter(f => f.startsWith('cricai-tts-') && f.endsWith('.mp3'));
      for (const file of ttsFiles.slice(-10)) { // Keep last 10
        await fs.unlink(path.join(os.tmpdir(), file)).catch(() => {});
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

export function listVoiceLanguages() {
  return Object.entries(VOICE_LANGUAGES).map(([id, cfg]) => ({
    id,
    label: cfg.label,
    group: cfg.group,
    voice: cfg.voice,
    lang: cfg.lang,
  }));
}
