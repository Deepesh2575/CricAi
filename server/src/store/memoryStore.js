import { randomUUID } from "crypto";
import { getScenarioDefaults } from "../services/scenarioDefaults.js";

const matches = new Map();

export function memoryCreateMatch(scenario = "death") {
  const defaults = getScenarioDefaults(scenario);
  const id = randomUUID();
  const doc = {
    _id: id,
    id,
    ...defaults,
    commentaryStyle: "filmy",
    status: "active",
    feedHistory: [],
    feedCount: 0,
    wagonWheel: [],
    latestCommentary:
      "Namaste cricket fans! CricAI MERN stack live hai — pehli ball bowl karo! 🏏✨",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  matches.set(id, doc);
  return doc;
}

export function memoryGetMatch(id) {
  return matches.get(id) || null;
}

export function memorySaveMatch(doc) {
  doc.updatedAt = new Date();
  matches.set(doc._id || doc.id, doc);
  return doc;
}

export function memoryListMatches() {
  return Array.from(matches.values()).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}
