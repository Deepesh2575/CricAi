export const DEMO_LIVE_TIMELINE = [
  { outcome: "DOT", score: 144, wickets: 4, overs: 19.1, desc: "Tight yorker, no run" },
  { outcome: "SIX", score: 150, wickets: 4, overs: 19.2, desc: "Massive six over long-on!" },
  { outcome: "FOUR", score: 154, wickets: 4, overs: 19.3, desc: "Cover drive boundary" },
  { outcome: "WICKET", score: 154, wickets: 5, overs: 19.4, desc: "Caught at deep mid-wicket" },
  { outcome: "RUNS", score: 156, wickets: 5, overs: 19.5, desc: "Quick two runs" },
  { outcome: "SIX", score: 162, wickets: 5, overs: 19.6, desc: "Last over six — stadium erupts!" },
];

export function parseESPNLiveTitle(title) {
  const match = title.match(
    /^(.+?)\s+(\d+)\/(\d+)\s+(?:\((\d+(?:\.\d+)?)\s+ov\))?/i
  );
  if (!match) return null;

  const team = match[1].trim();
  const runs = parseInt(match[2], 10);
  const wickets = parseInt(match[3], 10);
  const overs = match[4] ? parseFloat(match[4]) : 0;

  return { team, runs, wickets, overs };
}

export async function fetchLiveMatches() {
  const url = "https://www.espncricinfo.com/rss/livescores.xml";
  const proxy = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxy);
  if (!response.ok) throw new Error("Failed to fetch live scores");

  const xmlText = await response.text();
  const items = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  return items.map((itemMatch, index) => {
    const block = itemMatch[1];
    const title =
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)?.[1] ||
      block.match(/<title>(.*?)<\/title>/i)?.[1] ||
      "Live Match";
    const guid =
      block.match(/<guid>(.*?)<\/guid>/i)?.[1]?.trim() || `match-${index}`;
    return { title, guid };
  });
}
