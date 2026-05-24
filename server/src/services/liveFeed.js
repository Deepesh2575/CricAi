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

function detectMatchType(name = "", status = "") {
  const combined = `${name} ${status}`.toLowerCase();
  if (combined.includes("test")) return "Test";
  if (combined.includes("odi") || combined.includes("one day")) return "ODI";
  if (combined.includes("t20i") || combined.includes("twenty20 international")) return "T20I";
  if (combined.includes("ipl") || combined.includes("t20") || combined.includes("it20")) return "T20";
  return "T20";
}

function calcRunRate(runs, overs) {
  if (!overs || overs === 0) return 0;
  const fullOvers = Math.floor(overs);
  const balls = Math.round((overs % 1) * 10);
  const totalBalls = fullOvers * 6 + balls;
  if (totalBalls === 0) return 0;
  return Math.round((runs / totalBalls) * 6 * 100) / 100;
}

function calcRequiredRate(runsNeeded, oversRemaining) {
  if (!oversRemaining || oversRemaining <= 0) return 0;
  const fullOvers = Math.floor(oversRemaining);
  const decimalOvers = oversRemaining % 1;
  const balls = fullOvers * 6 + Math.round(decimalOvers * 10);
  if (balls === 0) return 0;
  return Math.round((runsNeeded / balls) * 6 * 100) / 100;
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
      const team1Short = m.teams?.[0]?.team?.abbreviation || team1.slice(0, 3).toUpperCase();
      const team2Short = m.teams?.[1]?.team?.abbreviation || team2.slice(0, 3).toUpperCase();
      const statusText = m.statusText || m.status || "";
      const seriesName = m.series?.name || "";

      // Detect which team is live / batting
      const battingTeamObj = m.teams?.find(t => t.isLive) || m.teams?.[0];
      const bowlingTeamObj = m.teams?.find(t => !t.isLive) || m.teams?.[1];
      const battingTeamName = battingTeamObj?.team?.name || team1;

      // Parse the live score
      let runs = 0, wickets = 0;
      const scoreStr = battingTeamObj?.score || battingTeamObj?.scoreInfo || "";
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

      // Parse overs
      let overs = 0;
      const oversRaw = m.liveOvers || battingTeamObj?.overs || "";
      if (oversRaw) {
        const oversNum = parseFloat(String(oversRaw).replace(/[^\d.]/g, ""));
        if (!isNaN(oversNum)) overs = oversNum;
      }
      if (!overs && battingTeamObj?.scoreInfo) {
        const ov = battingTeamObj.scoreInfo.match(/\(?([\d.]+)\s*ov/i);
        if (ov) overs = parseFloat(ov[1]);
      }

      // Parse target if 2nd innings
      let target = null;
      const targetMatch = statusText.match(/need\s+(\d+)\s+(?:more\s+)?run/i);
      if (targetMatch) target = parseInt(targetMatch[1], 10) + runs;

      // Innings array: both teams if we have score data
      const innings = [];
      for (const t of m.teams || []) {
        const tScore = t.score || t.scoreInfo || "";
        const sm = tScore.match(/(\d+)\/(\d+)/);
        const runsMatch = tScore.match(/^(\d+)$/);
        if (sm || runsMatch) {
          const r = sm ? parseInt(sm[1], 10) : parseInt(runsMatch[1], 10);
          const w = sm ? parseInt(sm[2], 10) : 10;
          const ovsRaw = t.overs || "";
          const ov = parseFloat(String(ovsRaw).replace(/[^\d.]/g, "")) || 0;
          innings.push({
            inning: t.team?.name || "Team",
            shortName: t.team?.abbreviation || t.team?.name?.slice(0, 3).toUpperCase() || "???",
            runs: r,
            wickets: w,
            overs: ov,
          });
        }
      }

      // Determine match type
      const matchType = detectMatchType(seriesName, statusText);

      // Calculate run rates
      const currentRunRate = calcRunRate(runs, overs);
      const maxOvers = matchType === "Test" ? 999 : matchType === "ODI" ? 50 : 20;
      const oversRemaining = Math.max(0, maxOvers - overs);
      const runsNeeded = target ? target - runs : null;
      const requiredRunRate = (runsNeeded !== null && oversRemaining > 0)
        ? calcRequiredRate(runsNeeded, oversRemaining)
        : null;

      // Title for backward compat with polling logic
      let title = "";
      if (runs > 0 || wickets > 0) {
        title = `${battingTeamName} ${runs}/${wickets} (${overs} ov)`;
      } else {
        title = `${team1} vs ${team2} — ${statusText || "Match yet to begin"}`;
      }
      
      const guid = `http://www.cricinfo.com/ci/engine/match/${m.objectId}.html`;
      
      return {
        // Legacy fields (backward compat)
        title,
        guid,
        // Rich structured fields
        team1,
        team2,
        team1Short,
        team2Short,
        battingTeam: battingTeamName,
        bowlingTeam: bowlingTeamObj?.team?.name || team2,
        matchType,
        series: seriesName,
        status: statusText,
        innings,
        // Current batting score
        score: runs,
        wickets,
        overs,
        target,
        runsNeeded,
        currentRunRate,
        requiredRunRate,
        maxOvers,
        objectId: m.objectId,
      };
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
        
        // Try to extract team names from RSS title  
        const parts = title.split(/\s+vs\s+|\s+v\s+/i);
        const team1 = parts[0]?.trim() || "Team A";
        const rest = parts[1] || "";
        const scorePartMatch = rest.match(/^(.+?)\s+\d+\/\d+/);
        const team2 = scorePartMatch ? scorePartMatch[1].trim() : rest.split(" ")[0] || "Team B";

        const parsed = parseESPNLiveTitle(title);
        return {
          title,
          guid,
          team1,
          team2,
          team1Short: team1.slice(0, 3).toUpperCase(),
          team2Short: team2.slice(0, 3).toUpperCase(),
          battingTeam: parsed?.team || team1,
          matchType: detectMatchType(title, ""),
          status: title,
          innings: parsed ? [{
            inning: parsed.team,
            shortName: parsed.team.slice(0, 3).toUpperCase(),
            runs: parsed.runs,
            wickets: parsed.wickets,
            overs: parsed.overs,
          }] : [],
          score: parsed?.runs || 0,
          wickets: parsed?.wickets || 0,
          overs: parsed?.overs || 0,
          target: null,
          runsNeeded: null,
          currentRunRate: calcRunRate(parsed?.runs || 0, parsed?.overs || 0),
          requiredRunRate: null,
          maxOvers: 20,
        };
      });
    } catch (err2) {
      console.error("[Cricinfo List] RSS fallback failed:", err2.message);
      return [];
    }
  }
}
