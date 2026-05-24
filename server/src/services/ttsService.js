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

export async function synthesizeSpeech(text, languageId = "hinglish", outcome) {
  try {
    const config = VOICE_LANGUAGES[languageId] || VOICE_LANGUAGES.hinglish;
    const cleaned = cleanTextForSpeech(text);
    
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
