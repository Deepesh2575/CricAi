const nlpScore = (text, tokens) => tokens.filter((t) => text.includes(t)).length;

export function parseAgentIntent(userText) {
  const text = userText.toLowerCase().trim();
  let reply = "";
  let action = null;

  const isDhoni = nlpScore(text, ["dhoni", "mahi", "ms dhoni", "msd", "captain cool", "thala"]) > 0;
  const isKohli = nlpScore(text, ["kohli", "virat", "king kohli", "vk", "king"]) > 0;
  const isBumrah = nlpScore(text, ["bumrah", "jasprit", "jassi", "malinga"]) > 0;
  const isSachin = nlpScore(text, ["sachin", "tendulkar", "master blaster", "god of cricket"]) > 0;
  const isRohit = nlpScore(text, ["rohit", "hitman", "ro hit", "rohit sharma"]) > 0;

  const isSix = nlpScore(text, ["six", "sixer", "chakka", "chhakka", "6", "helicopter", "maximum"]) > 0;
  const isFour = nlpScore(text, ["four", "chauka", "4", "drive", "cut shot", "pull", "boundary"]) > 0;
  const isWicket = nlpScore(text, ["wicket", "out", "bold", "bowled", "caught", "lbw", "dismiss", "stumped"]) > 0;
  const isDhol = nlpScore(text, ["dhol", "drum", "punjabi", "balle", "beat", "dholak"]) > 0;
  const isTrump = nlpScore(text, ["trumpet", "horn", "ipl music", "ipl sound", "bugle", "fanfare"]) > 0;
  const isCheer = nlpScore(text, ["cheer", "crowd", "roar", "stadium", "shor", "applause"]) > 0;
  const isStats = nlpScore(text, ["probability", "win", "chance", "analys", "predict", "odds", "kya lagta", "kitna"]) > 0;
  const isReset = nlpScore(text, ["reset", "restart", "new match", "start over", "shuru se", "naya match"]) > 0;
  const isDot = nlpScore(text, ["dot", "maiden", "dot ball", "no run", "tight", "defend"]) > 0;
  const isExtra = nlpScore(text, ["wide", "no ball", "extra", "noball", "wides"]) > 0;

  const updates = {};

  if (isDhoni && isSix) {
    updates.striker = "MS Dhoni";
    updates.strikerStyle = "Aggressive hitter";
    reply = "Mahi bhai ka order! 🚁 Helicopter shot — ball orbit mein!";
    action = { type: "bowl", outcome: "SIX" };
  } else if (isSachin && isSix) {
    updates.striker = "Sachin Tendulkar";
    updates.strikerStyle = "Anchor";
    reply = "God of Cricket! 🙏 Master Blaster ne straight six maara!";
    action = { type: "bowl", outcome: "SIX" };
  } else if (isRohit && isSix) {
    updates.striker = "Rohit Sharma";
    updates.strikerStyle = "Aggressive hitter";
    reply = "HITMAN UNLEASHED! 💥 Pull shot se bleachers mein!";
    action = { type: "bowl", outcome: "SIX" };
  } else if (isKohli && isSix) {
    updates.striker = "Virat Kohli";
    updates.strikerStyle = "Anchor";
    reply = "King Kohli ne CHAKKA MAAR DIYA! 👑";
    action = { type: "bowl", outcome: "SIX" };
  } else if (isDhoni && isFour) {
    updates.striker = "MS Dhoni";
    updates.strikerStyle = "Anchor";
    reply = "Cool Dhoni ne precision cover boundary — chaar runs! 🧊";
    action = { type: "bowl", outcome: "FOUR" };
  } else if (isKohli && isFour) {
    updates.striker = "Virat Kohli";
    updates.strikerStyle = "Anchor";
    reply = "King Kohli cover drive four — pure class! 👑";
    action = { type: "bowl", outcome: "FOUR" };
  } else if (isBumrah && isWicket) {
    updates.bowler = "Jasprit Bumrah";
    reply = "BUMRAH IN! 💀 Lethal yorker — BOWLED HIM!";
    action = { type: "bowl", outcome: "WICKET" };
  } else if (isDhoni && isWicket) {
    updates.striker = "MS Dhoni";
    reply = "Dhoni out!? 😲 Stadium shocked silence!";
    action = { type: "bowl", outcome: "WICKET" };
  } else if (isDhol) {
    reply = "Balle Balle! 🥁 Desi Dhol beats chalu!";
    action = { type: "sfx", sound: "dhol" };
  } else if (isTrump) {
    reply = "IPL trumpet sequence! 📣🏟️";
    action = { type: "sfx", sound: "horn" };
  } else if (isCheer) {
    reply = "Crowd roar unleashed! 🏟️ 50,000 log cheering!";
    action = { type: "sfx", sound: "cheer" };
  } else if (isStats) {
    reply = "stats";
    action = { type: "stats" };
  } else if (isReset) {
    reply = "Nayi inning shuru! 🏏 Scoreboard reset!";
    action = { type: "reset" };
  } else if (isSix) {
    reply = "Boom! 💥 Massive sixer — crowd goes wild!";
    action = { type: "bowl", outcome: "SIX" };
  } else if (isFour) {
    reply = "Beautiful boundary! 🔵 Bullet chauka!";
    action = { type: "bowl", outcome: "FOUR" };
  } else if (isWicket) {
    reply = "Clean bowled! 💀 Stump ukhad ke rakh diya!";
    action = { type: "bowl", outcome: "WICKET" };
  } else if (isDot) {
    reply = "Dot ball! 🎯 Tight line and length!";
    action = { type: "bowl", outcome: "DOT" };
  } else if (isExtra) {
    reply = "Wide ball! 😤 Free run batting team ko!";
    action = { type: "bowl", outcome: "EXTRA" };
  } else if (text.includes("sarcast")) {
    updates.commentaryStyle = "sarcastic";
    reply = "😏 Sarcastic Desi fun commentary active!";
  } else if (text.includes("filmy")) {
    updates.commentaryStyle = "filmy";
    reply = "🎬 Bollywood Filmy drama active!";
  } else if (text.includes("aggress")) {
    updates.commentaryStyle = "aggressive";
    reply = "⚡ Aggressive High-Voltage commentary active!";
  } else {
    reply =
      "🤖 CricAI Copilot ready! Try: six, four, wicket, dhol, Dhoni six, Kohli drive, Bumrah wicket, win probability, reset";
  }

  return { reply, action, updates };
}
