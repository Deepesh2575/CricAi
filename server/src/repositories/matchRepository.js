import { isMemoryMode } from "../config/db.js";
import Match from "../models/Match.js";
import {
  memoryCreateMatch,
  memoryGetMatch,
  memorySaveMatch,
} from "../store/memoryStore.js";

function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id?.toString?.() || obj.id || obj._id;
  return obj;
}

export async function createMatch(scenario = "death") {
  if (isMemoryMode()) {
    return memoryCreateMatch(scenario);
  }
  const doc = await Match.create({ scenario });
  return toPlain(doc);
}

export async function getMatchById(id) {
  if (isMemoryMode()) {
    return memoryGetMatch(id);
  }
  const doc = await Match.findById(id);
  return toPlain(doc);
}

export async function saveMatch(match) {
  if (isMemoryMode()) {
    return memorySaveMatch(match);
  }
  const id = match._id || match.id;
  const updated = await Match.findByIdAndUpdate(
    id,
    {
      scenario: match.scenario,
      score: match.score,
      wickets: match.wickets,
      overs: match.overs,
      ballsInOver: match.ballsInOver,
      target: match.target,
      striker: match.striker,
      strikerStyle: match.strikerStyle,
      bowler: match.bowler,
      commentaryStyle: match.commentaryStyle,
      status: match.status,
      feedHistory: match.feedHistory,
      feedCount: match.feedCount,
      wagonWheel: match.wagonWheel,
      latestCommentary: match.latestCommentary,
    },
    { new: true }
  );
  return toPlain(updated);
}
