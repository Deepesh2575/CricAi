import { LANG_TO_BCP47, cleanCommentaryForSpeech } from "./voiceLanguages.js";

const speechSynth =
  typeof window !== "undefined" ? window.speechSynthesis : null;

let currentAudio = null;
let currentObjectUrl = null;

function stopAllSpeech() {
  if (speechSynth) speechSynth.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function pickBrowserVoice(languageId) {
  if (!speechSynth) return null;
  const voices = speechSynth.getVoices();
  const lang = LANG_TO_BCP47[languageId] || "hi-IN";
  const prefix = lang.split("-")[0];

  return (
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith(lang)) ||
    voices.find((v) => v.lang.startsWith(prefix)) ||
    voices.find((v) => v.lang.includes("hi-IN")) ||
    voices.find((v) => v.lang.includes("en-IN")) ||
    voices[0] ||
    null
  );
}

function speakWithBrowser(text, { languageId, speechRate, outcome, onStart, onEnd }) {
  if (!speechSynth) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  const lang = LANG_TO_BCP47[languageId] || "hi-IN";
  utterance.lang = lang;

  const voice = pickBrowserVoice(languageId);
  if (voice) utterance.voice = voice;

  let rateMult = speechRate;
  if (outcome === "SIX" || outcome === "WICKET") {
    utterance.pitch = 1.35;
    utterance.rate = rateMult * 1.15;
  } else if (outcome === "FOUR") {
    utterance.pitch = 1.15;
    utterance.rate = rateMult * 1.05;
  } else {
    utterance.pitch = 1.0;
    utterance.rate = rateMult * 0.95;
  }

  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  speechSynth.speak(utterance);
  return true;
}

async function speakWithAiVoice(text, { languageId, outcome, onStart, onEnd }) {
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${API_BASE}/api/tts/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, languageId, outcome }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `TTS failed (${res.status})`);
  }

  const blob = await res.blob();
  stopAllSpeech();

  currentObjectUrl = URL.createObjectURL(blob);
  currentAudio = new Audio(currentObjectUrl);

  currentAudio.onplay = onStart;
  currentAudio.onended = () => {
    onEnd?.();
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
    currentAudio = null;
  };
  currentAudio.onerror = () => {
    onEnd?.();
    currentAudio = null;
  };

  await currentAudio.play();
}

/**
 * Speak commentary — AI neural voice (server) with browser fallback.
 */
export async function speakCommentary({
  text,
  outcome,
  languageId = "hinglish",
  speechRate = 1,
  ttsEnabled = true,
  useAiVoice = true,
  onStart,
  onEnd,
}) {
  if (!ttsEnabled || !text?.trim()) return;

  const spokenText = cleanCommentaryForSpeech(text);
  if (!spokenText) return;

  stopAllSpeech();

  if (useAiVoice) {
    try {
      await speakWithAiVoice(spokenText, {
        languageId,
        outcome,
        onStart: () => onStart?.(),
        onEnd: () => onEnd?.(),
      });
      return;
    } catch (err) {
      console.warn("AI voice fallback to browser:", err.message);
    }
  }

  speakWithBrowser(spokenText, {
    languageId,
    speechRate,
    outcome,
    onStart: () => onStart?.(),
    onEnd: () => onEnd?.(),
  });
}

export function stopCommentarySpeech() {
  stopAllSpeech();
}

export function preloadBrowserVoices() {
  if (!speechSynth) return;
  speechSynth.getVoices();
  speechSynth.onvoiceschanged = () => speechSynth.getVoices();
}
