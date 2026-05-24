export const VOICE_LANGUAGE_OPTIONS = [
  { id: "hinglish", label: "Hinglish (Hindi + English mix)", group: "India" },
  { id: "hindi", label: "हिन्दी — Hindi", group: "India" },
  { id: "english_in", label: "English (India)", group: "India" },
  { id: "tamil", label: "தமிழ் — Tamil", group: "India" },
  { id: "telugu", label: "తెలుగు — Telugu", group: "India" },
  { id: "bengali", label: "বাংলা — Bengali", group: "India" },
  { id: "marathi", label: "मराठी — Marathi", group: "India" },
  { id: "kannada", label: "ಕನ್ನಡ — Kannada", group: "India" },
  { id: "malayalam", label: "മലയാളം — Malayalam", group: "India" },
  { id: "punjabi", label: "ਪੰਜਾਬੀ — Punjabi", group: "India" },
  { id: "gujarati", label: "ગુજરાતી — Gujarati", group: "India" },
  { id: "urdu", label: "اردو — Urdu", group: "India" },
  { id: "english_us", label: "English (US)", group: "International" },
  { id: "english_uk", label: "English (UK)", group: "International" },
  { id: "arabic", label: "العربية — Arabic", group: "International" },
  { id: "spanish", label: "Español — Spanish", group: "International" },
  { id: "french", label: "Français — French", group: "International" },
  { id: "german", label: "Deutsch — German", group: "International" },
  { id: "portuguese", label: "Português — Portuguese", group: "International" },
  { id: "japanese", label: "日本語 — Japanese", group: "International" },
  { id: "chinese", label: "中文 — Chinese", group: "International" },
];

export const LANG_TO_BCP47 = {
  hinglish: "hi-IN",
  hindi: "hi-IN",
  english_in: "en-IN",
  english_us: "en-US",
  english_uk: "en-GB",
  tamil: "ta-IN",
  telugu: "te-IN",
  bengali: "bn-IN",
  marathi: "mr-IN",
  kannada: "kn-IN",
  malayalam: "ml-IN",
  punjabi: "pa-IN",
  gujarati: "gu-IN",
  urdu: "ur-IN",
  arabic: "ar-SA",
  spanish: "es-ES",
  french: "fr-FR",
  german: "de-DE",
  portuguese: "pt-BR",
  japanese: "ja-JP",
  chinese: "zh-CN",
};

export function cleanCommentaryForSpeech(text) {
  return text
    .replace(/🎮|🏏|🏟️|✨|👏|🔥|📣|🔊|😬|💥|🤪|🕺|🎉|OMG|💀|🎯|⚡|⚠️|🏆|👑|🌟|📊|🤖|🥁|🚁|🧊|😏|🎬|😲|🤫|😤/gi, "")
    .replace(/CROWD GOES WILD/gi, "Crowd goes wild")
    .replace(/\s+/g, " ")
    .trim();
}
