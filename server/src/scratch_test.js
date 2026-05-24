import "dotenv/config";
import { fetchLiveMatches } from "./services/liveFeed.js";

console.log("=========================================");
console.log("   CRICAI REAL-WORLD LIVE MATCHES TEST   ");
console.log("=========================================");

try {
  console.log("Fetching live matches from Cricinfo Scores Page...");
  const matches = await fetchLiveMatches();
  console.log(`\nSuccessfully loaded ${matches.length} active matches!\n`);

  matches.forEach((m, index) => {
    console.log(`Match #${index + 1}:`);
    console.log(`- Title: "${m.title}"`);
    console.log(`- GUID:  "${m.guid}"`);
    console.log("-----------------------------------------");
  });
} catch (e) {
  console.error("Test failed:", e.message);
}
