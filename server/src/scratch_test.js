import "dotenv/config";

async function printCompleteMatchObject() {
  const url = "https://www.espncricinfo.com/live-cricket-score";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (res.ok) {
      const html = await res.text();
      const scriptMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (scriptMatch) {
        const data = JSON.parse(scriptMatch[1].trim());
        const list = data?.props?.appPageProps?.data?.content?.matches || 
                     data?.props?.editionDetails?.trendingMatches?.matches || [];
        
        if (list.length > 0) {
          // Find a match that has scores or status text if possible
          const matchWithScore = list.find(m => m.teams?.some(t => t.score)) || list[0];
          console.log("Full Match Object JSON:");
          console.log(JSON.stringify(matchWithScore, null, 2));
        }
      }
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

printCompleteMatchObject();
