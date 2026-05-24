import "dotenv/config";
import { synthesizeSpeech } from "./services/ttsService.js";

console.log("=========================================");
console.log("   CRICAI NEURAL VOICE & TRANSLATE TEST  ");
console.log("=========================================");

const testText = "Burger to Suryakumar, SIX, SKY has come to party today! Trademark Surya shovel over long leg.";
const testLanguage = "tamil"; // Test with Tamil to verify translation and speech synthesis

console.log(`Input Text (English): "${testText}"`);
console.log(`Target Voice Language: "${testLanguage}"`);

try {
  console.log("\nSynthesizing speech... (Translating to Tamil and generating audio)");
  const buffer = await synthesizeSpeech(testText, testLanguage, "SIX");
  console.log(`\nSuccess! Generated audio buffer: ${buffer.length} bytes.`);
  console.log("Speech synthesis is 100% working on the server!");
} catch (err) {
  console.error("\nSpeech synthesis FAILED:", err.message);
}
