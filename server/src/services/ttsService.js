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
  const config = VOICE_LANGUAGES[languageId] || VOICE_LANGUAGES.hinglish;
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    throw new Error("No text to speak");
  }

  const mods = getOutcomeSpeechModifiers(outcome);
  const tmpFile = path.join(os.tmpdir(), `cricai-tts-${randomUUID()}.mp3`);

  const tts = new EdgeTTS({
    voice: config.voice,
    lang: config.lang,
    rate: mods.rate,
    pitch: mods.pitch,
    timeout: 20000,
  });

  try {
    await tts.ttsPromise(cleaned.slice(0, 900), tmpFile);
    const buffer = await fs.readFile(tmpFile);
    return buffer;
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
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
