/** Neural voices (Microsoft Edge TTS) + browser Speech API lang codes */
export const VOICE_LANGUAGES = {
  hinglish: {
    label: "Hinglish (Hindi + English mix)",
    voice: "hi-IN-SwaraNeural",
    lang: "hi-IN",
    group: "India",
  },
  hindi: {
    label: "हिन्दी — Hindi",
    voice: "hi-IN-MadhurNeural",
    lang: "hi-IN",
    group: "India",
  },
  english_in: {
    label: "English (India)",
    voice: "en-IN-NeerjaNeural",
    lang: "en-IN",
    group: "India",
  },
  english_us: {
    label: "English (US)",
    voice: "en-US-JennyNeural",
    lang: "en-US",
    group: "International",
  },
  english_uk: {
    label: "English (UK)",
    voice: "en-GB-SoniaNeural",
    lang: "en-GB",
    group: "International",
  },
  tamil: {
    label: "தமிழ் — Tamil",
    voice: "ta-IN-PallaviNeural",
    lang: "ta-IN",
    group: "India",
  },
  telugu: {
    label: "తెలుగు — Telugu",
    voice: "te-IN-ShrutiNeural",
    lang: "te-IN",
    group: "India",
  },
  bengali: {
    label: "বাংলা — Bengali",
    voice: "bn-IN-TanishaaNeural",
    lang: "bn-IN",
    group: "India",
  },
  marathi: {
    label: "मराठी — Marathi",
    voice: "mr-IN-AarohiNeural",
    lang: "mr-IN",
    group: "India",
  },
  kannada: {
    label: "ಕನ್ನಡ — Kannada",
    voice: "kn-IN-SapnaNeural",
    lang: "kn-IN",
    group: "India",
  },
  malayalam: {
    label: "മലയാളം — Malayalam",
    voice: "ml-IN-SobhanaNeural",
    lang: "ml-IN",
    group: "India",
  },
  punjabi: {
    label: "ਪੰਜਾਬੀ — Punjabi",
    voice: "pa-IN-VaaniNeural",
    lang: "pa-IN",
    group: "India",
  },
  gujarati: {
    label: "ગુજરાતી — Gujarati",
    voice: "gu-IN-DhwaniNeural",
    lang: "gu-IN",
    group: "India",
  },
  urdu: {
    label: "اردو — Urdu",
    voice: "ur-IN-GulNeural",
    lang: "ur-IN",
    group: "India",
  },
  arabic: {
    label: "العربية — Arabic",
    voice: "ar-SA-ZariyahNeural",
    lang: "ar-SA",
    group: "International",
  },
  spanish: {
    label: "Español — Spanish",
    voice: "es-ES-ElviraNeural",
    lang: "es-ES",
    group: "International",
  },
  french: {
    label: "Français — French",
    voice: "fr-FR-DeniseNeural",
    lang: "fr-FR",
    group: "International",
  },
  german: {
    label: "Deutsch — German",
    voice: "de-DE-KatjaNeural",
    lang: "de-DE",
    group: "International",
  },
  portuguese: {
    label: "Português — Portuguese",
    voice: "pt-BR-FranciscaNeural",
    lang: "pt-BR",
    group: "International",
  },
  japanese: {
    label: "日本語 — Japanese",
    voice: "ja-JP-NanamiNeural",
    lang: "ja-JP",
    group: "International",
  },
  chinese: {
    label: "中文 — Chinese",
    voice: "zh-CN-XiaoxiaoNeural",
    lang: "zh-CN",
    group: "International",
  },
};

export function getOutcomeSpeechModifiers(outcome) {
  if (outcome === "SIX" || outcome === "WICKET") {
    return { rate: "+18%", pitch: "+8Hz" };
  }
  if (outcome === "FOUR") {
    return { rate: "+10%", pitch: "+4Hz" };
  }
  return { rate: "+2%", pitch: "+0Hz" };
}

export function cleanTextForSpeech(text) {
  return text
    .replace(/🎮|🏏|🏟️|✨|👏|🔥|📣|🔊|😬|💥|🤪|🕺|🎉|OMG|💀|🎯|⚡|⚠️|🏆|👑|🌟|📊|🤖|🥁|🚁|🧊|😏|🎬|😲|🤫|😤/gi, "")
    .replace(/CROWD GOES WILD/gi, "Crowd goes wild")
    .replace(/Aaaaand the stadium erupts/gi, "And the stadium erupts")
    .replace(/\s+/g, " ")
    .trim();
}
