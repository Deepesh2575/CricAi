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
  try {
    const url = "https://www.espncricinfo.com/live-cricket-score";
    console.log(`[Cricinfo List] Fetching real-time live scores from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const html = await response.text();
    const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      console.warn("[Cricinfo List] Could not find __NEXT_DATA__ script block in live scores page");
      return [];
    }

    const data = JSON.parse(scriptMatch[1].trim());
    const matchesList = data?.props?.appPageProps?.data?.content?.matches || 
                        data?.props?.editionDetails?.trendingMatches?.matches || [];
                        
    console.log(`[Cricinfo List] Successfully loaded ${matchesList.length} active live matches.`);

    return matchesList.map((m) => {
      const team1 = m.teams?.[0]?.team?.name || "Team A";
      const team2 = m.teams?.[1]?.team?.name || "Team B";
      const status = m.statusText || "";
      
      const battingTeam = m.teams?.find(t => t.isLive) || m.teams?.[0];
      const battingTeamName = battingTeam?.team?.name || team1;
      
      let runs = 0;
      let wickets = 0;
      const scoreStr = battingTeam?.score || "";
      const scoreMatch = scoreStr.match(/(\d+)\/(\d+)/);
      if (scoreMatch) {
        runs = parseInt(scoreMatch[1], 10);
        wickets = parseInt(scoreMatch[2], 10);
      } else {
        const runsOnlyMatch = scoreStr.match(/^(\d+)$/);
        if (runsOnlyMatch) {
          runs = parseInt(runsOnlyMatch[1], 10);
          wickets = 10;
        }
      }
      
      const overs = m.liveOvers || (battingTeam?.scoreInfo ? parseFloat(battingTeam.scoreInfo) : 0);
      
      // If we have runs and wickets, format in the classic parseable RSS format!
      let title = "";
      if (runs > 0 || wickets > 0) {
        title = `${battingTeamName} ${runs}/${wickets} (${overs} ov)`;
      } else {
        title = `${team1} vs ${team2} — ${status || "Match yet to begin"}`;
      }
      
      const guid = `http://www.cricinfo.com/ci/engine/match/${m.objectId}.html`;
      
      return { title, guid };
    });
  } catch (err) {
    console.error("[Cricinfo List] Error loading matches page:", err.message);
    
    // Fall back to RSS feed if live score page scraper fails
    try {
      console.log("[Cricinfo List] Falling back to RSS livescores feed...");
      const rssUrl = "https://www.espncricinfo.com/rss/livescores.xml";
      const res = await fetch(rssUrl);
      if (!res.ok) throw new Error("Failed to fetch RSS feed");
      const xmlText = await res.text();
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
    } catch (err2) {
      console.error("[Cricinfo List] RSS fallback failed:", err2.message);
      return [];
    }
  }
}
