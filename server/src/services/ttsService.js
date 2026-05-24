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
  // Declare outside try so finally block can access them
  let tts = null;
  let tmpFile = null;

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
    tmpFile = path.join(os.tmpdir(), `cricai-tts-${randomUUID()}.mp3`);

    console.log(`TTS: Synthesizing for ${languageId} (${config.voice}), length: ${cleaned.length}`);

    // Ensure any previous job is cancelled before starting a new one
    if (global.currentTtsJob && typeof global.currentTtsJob.cancel === "function") {
      try {
        global.currentTtsJob.cancel();
      } catch (e) {
        console.warn("Failed to cancel previous TTS job", e.message);
      }
    }

    tts = new EdgeTTS({
      voice: config.voice,
      lang: config.lang,
      rate: mods.rate,
      pitch: mods.pitch,
      timeout: 20000,
    });

    // Store job reference for possible later cancellation
    global.currentTtsJob = tts;

    await tts.ttsPromise(cleaned.slice(0, 900), tmpFile);
    const buffer = await fs.readFile(tmpFile);
    
    console.log(`TTS: Successfully generated audio (${buffer.length} bytes) for ${languageId}`);
    
    return buffer;
  } catch (err) {
    console.error(`TTS Error for language ${languageId}:`, err.message);
    throw new Error(`Text-to-speech synthesis failed: ${err.message}`);
  } finally {
    // Clear global reference after completion
    if (tts && global.currentTtsJob === tts) {
      global.currentTtsJob = null;
    }
    // Clean up only the temp file we created
    if (tmpFile) {
      fs.unlink(tmpFile).catch(() => {});
    }
  }
}

export function stopCurrentSpeech() {
  if (global.currentTtsJob && typeof global.currentTtsJob.cancel === "function") {
    try {
      global.currentTtsJob.cancel();
    } catch (e) {
      console.warn("Failed to cancel TTS job via stopCurrentSpeech", e.message);
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
