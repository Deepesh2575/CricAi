import { useState, useEffect, useRef } from "react";
import { api } from "./api/client.js";
import { playSynthSound, playOutcomeSounds } from "./utils/audio.js";
import {
  speakCommentary,
  stopCommentarySpeech,
  preloadBrowserVoices,
} from "./utils/commentarySpeaker.js";
import { VOICE_LANGUAGE_OPTIONS } from "./utils/voiceLanguages.js";
import LiveScorePanel from "./LiveScorePanel.jsx";
import "./App.css";

function computeWinProbabilities(m) {
  if (!m) return { batting: 50, bowling: 50 };
  const { score, wickets, target, scenario, overs, ballsInOver } = m;
  if (score >= target) return { batting: 100, bowling: 0 };
  if (wickets >= 10) return { batting: 0, bowling: 100 };

  let batting = 50;
  const diff = target - score;

  if (scenario === "death" || scenario === "lastball") {
    const currentTotalBalls = Math.floor(overs) * 6 + (ballsInOver || 0);
    const ballsRemaining = Math.max(1, 120 - currentTotalBalls);
    const reqRunRate = (diff / ballsRemaining) * 6;

    if (reqRunRate > 18) batting = 8;
    else if (reqRunRate > 13) batting = 22;
    else if (reqRunRate > 9) batting = 45;
    else batting = 78;

    batting -= wickets * 4.5;
    batting = Math.max(4, Math.min(96, batting));
  } else {
    batting = 65 - wickets * 6;
    batting = Math.max(10, Math.min(90, batting));
  }

  return { batting, bowling: 100 - batting };
}

function parseESPNLiveTitle(title) {
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

function scenarioLabel(scenario) {
  if (scenario === "death") return "Death Overs";
  if (scenario === "powerplay") return "Powerplay";
  if (scenario === "lastball") return "Last Ball Climax";
  if (scenario === "middle") return "Middle Overs";
  return "Championship";
}

export default function App() {
  const [matchId, setMatchId] = useState(null);
  const [match, setMatch] = useState(null);
  const [probabilities, setProbabilities] = useState({ batting: 50, bowling: 50 });
  const [wagonWheel, setWagonWheel] = useState([]);
  const [playMode, setPlayMode] = useState("free");
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === "undefined") return "arena";
    return window.location.hash.slice(1) || "arena";
  });

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [commentaryStyle, setCommentaryStyle] = useState("filmy");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voiceLanguage, setVoiceLanguage] = useState(
    () => localStorage.getItem("cricai-voice-lang") || "hinglish"
  );
  const [useAiVoice, setUseAiVoice] = useState(
    () => localStorage.getItem("cricai-ai-voice") !== "false"
  );
  const [customPrompt, setCustomPrompt] = useState("");

  const [feedHistory, setFeedHistory] = useState([]);
  const [feedCount, setFeedCount] = useState(0);
  const [commentaryText, setCommentaryText] = useState(
    "Namaste cricket fans! CricAI MERN stack live hai — pehli ball bowl karo! 🏏✨"
  );
  const [commentaryHighlight, setCommentaryHighlight] = useState("");
  const [crowdMeter, setCrowdMeter] = useState({
    fill: 60,
    status: "Loud & Cheering",
  });

  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryData, setVictoryData] = useState({ title: "", message: "" });

  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedLiveMatch, setSelectedLiveMatch] = useState("demo");
  const [liveConnectionStatus, setLiveConnectionStatus] = useState(
    "Connected. Awaiting events..."
  );

  const [chatMessages, setChatMessages] = useState([
    {
      sender: "agent",
      text: "Namaste! Main hoon CricAI MERN Copilot. Live commentary streaming...",
    },
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const [mernLogs, setMernLogs] = useState([]);
  const [dbMode, setDbMode] = useState("mongodb");
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState(true);

  const livePollTimer = useRef(null);
  const demoTimelineRef = useRef([]);
  const liveDemoIndex = useRef(0);
  const lastScoreString = useRef("");
  const lastRuns = useRef(null);
  const lastWickets = useRef(null);
  const lastOvers = useRef(null);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(window.location.hash.slice(1) || "arena");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (page) => {
    window.location.hash = page;
  };

  const logMernRequest = (method, endpoint, payload, response) => {
    const timestamp = new Date().toLocaleTimeString();
    setMernLogs((prev) =>
      [
        {
          method,
          endpoint,
          timestamp,
          payload:
            typeof payload === "object"
              ? JSON.stringify(payload, null, 2)
              : payload,
          response:
            typeof response === "object"
              ? JSON.stringify(response, null, 2)
              : response,
        },
        ...prev,
      ].slice(0, 7)
    );
  };

  const syncFromMatch = (m, probs) => {
    if (!m) return;
    setMatch(m);
    setProbabilities(probs ?? computeWinProbabilities(m));
    setCommentaryStyle(m.commentaryStyle || "filmy");
    setFeedHistory(m.feedHistory || []);
    setFeedCount(m.feedCount || 0);
    if (m.latestCommentary) setCommentaryText(m.latestCommentary);
    setWagonWheel(m.wagonWheel || []);
  };

  const getWinProbabilities = () => probabilities;

  const triggerToast = (msg) => {
    const toast = document.getElementById("voice-toast");
    if (toast) {
      document.getElementById("toast-text").innerText = msg;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 3200);
    }
  };

  const setCommentaryHighlightForOutcome = (outcome) => {
    if (outcome === "SIX") setCommentaryHighlight("highlight-six");
    else if (outcome === "FOUR") setCommentaryHighlight("highlight-four");
    else if (outcome === "WICKET") setCommentaryHighlight("highlight-wicket");
    else setCommentaryHighlight("");
  };

  const adjustCrowdMeter = (outcome) => {
    let fill = 60;
    let status = "Loud & Cheering";

    if (outcome === "SIX") {
      fill = 99;
      status = "DEAFENING ROAR! 🎉🏟️";
    } else if (outcome === "FOUR") {
      fill = 88;
      status = "Crowd is Dancing! 🥳🔥";
    } else if (outcome === "WICKET") {
      fill = 28;
      status = "Stunned silence... 😲🤫";
    } else if (outcome === "EXTRA") {
      fill = 78;
      status = "Booing the bowler! 😤⚠️";
    } else if (outcome === "DOT") {
      fill = 48;
      status = "High anxiety tension 😬";
    }

    setCrowdMeter({ fill, status });
  };

  const handleVictory = (victory) => {
    if (!victory?.ended) return;
    setVictoryData({ title: victory.title, message: victory.message });
    setTimeout(() => {
      setShowVictoryModal(true);
      playSynthSound("horn", sfxEnabled);
      setTimeout(() => {
        playSynthSound("cheer", sfxEnabled);
        playSynthSound("dhol", sfxEnabled);
      }, 400);
    }, 1200);
  };

  const triggerVisualFieldAnimation = (outcome, callback) => {
    const ball = document.getElementById("field-ball");
    const spark = document.getElementById("bat-hit-spark");
    const trajectory = document.getElementById("ball-trajectory");
    const visualBowler = document.getElementById("visual-bowler");
    const visualStriker = document.getElementById("visual-striker");
    const fieldHint = document.getElementById("stadium-sub-status");
    const bowlerName = match?.bowler || "Bowler";

    if (!ball) {
      if (callback) callback();
      return;
    }

    ball.style.display = "block";
    ball.style.left = "31%";
    ball.style.top = "50%";
    ball.style.transform = "translate(-50%, -50%) scale(1)";

    if (spark) spark.style.transform = "translate(50%, -50%) scale(0)";
    if (trajectory) trajectory.style.opacity = "0";

    if (fieldHint) {
      fieldHint.innerText = `${bowlerName} is delivering the ball...`;
      fieldHint.className = "field-hint text-yellow";
    }

    if (visualBowler) {
      visualBowler.classList.add("delivering");
      setTimeout(() => visualBowler.classList.remove("delivering"), 500);
    }

    setTimeout(() => {
      ball.style.transition = "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      ball.style.left = "68%";

      setTimeout(() => {
        if (visualStriker) {
          visualStriker.classList.add("swinging");
          setTimeout(() => visualStriker.classList.remove("swinging"), 400);
        }
      }, 250);

      setTimeout(() => {
        playSynthSound("bat", sfxEnabled);
        if (spark) spark.style.transform = "translate(50%, -50%) scale(1.6)";
        if (trajectory) {
          trajectory.style.left = "68%";
          trajectory.style.top = "50%";
          trajectory.style.opacity = "0.5";
        }

        if (outcome === "SIX") {
          ball.style.transition = "all 0.7s cubic-bezier(0.19, 1, 0.22, 1)";
          ball.style.left = "88%";
          ball.style.top = "15%";
          ball.style.transform = "translate(-50%, -50%) scale(2.2)";
          if (trajectory) {
            trajectory.style.width = "120px";
            trajectory.style.transform = "rotate(-45deg)";
          }
          if (fieldHint) {
            fieldHint.innerText = "IT'S A GIGANTIC SIX! 🎉";
            fieldHint.className = "field-hint text-yellow text-pulse";
          }
          setTimeout(() => {
            playSynthSound("cheer", sfxEnabled);
            playSynthSound("horn", sfxEnabled);
            playSynthSound("dhol", sfxEnabled);
          }, 150);
        } else if (outcome === "FOUR") {
          ball.style.transition = "all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)";
          ball.style.left = "92%";
          ball.style.top = "78%";
          if (trajectory) {
            trajectory.style.width = "140px";
            trajectory.style.transform = "rotate(35deg)";
          }
          if (fieldHint) {
            fieldHint.innerText = "STUNNING BOUNDARY FOUR! ⚡";
            fieldHint.className = "field-hint text-blue text-pulse";
          }
          setTimeout(() => {
            playSynthSound("cheer", sfxEnabled);
            playSynthSound("dhol", sfxEnabled);
          }, 150);
        } else if (outcome === "WICKET") {
          ball.style.transition = "all 0.4s ease-out";
          ball.style.left = "74%";
          ball.style.top = "30%";
          if (trajectory) {
            trajectory.style.width = "40px";
            trajectory.style.transform = "rotate(-85deg)";
          }
          if (fieldHint) {
            fieldHint.innerText = "OUT! BOWLED HIM! 💀";
            fieldHint.className = "field-hint text-red text-pulse";
          }
          setTimeout(() => {
            playSynthSound("aww", sfxEnabled);
            playSynthSound("whistle", sfxEnabled);
          }, 150);
        } else if (outcome === "RUNS") {
          ball.style.transition = "all 0.5s ease-out";
          ball.style.left = "80%";
          ball.style.top = "58%";
          if (trajectory) {
            trajectory.style.width = "80px";
            trajectory.style.transform = "rotate(15deg)";
          }
          if (fieldHint) {
            fieldHint.innerText = "Quick running in active ground!";
            fieldHint.className = "field-hint text-green";
          }
          setTimeout(() => playSynthSound("cheer", sfxEnabled), 200);
        } else if (outcome === "EXTRA") {
          ball.style.transition = "all 0.3s ease-out";
          ball.style.left = "72%";
          ball.style.top = "65%";
          if (fieldHint) {
            fieldHint.innerText = "EXTRA RUN FOR BATTING TEAM!";
            fieldHint.className = "field-hint text-yellow";
          }
          setTimeout(() => playSynthSound("whistle", sfxEnabled), 100);
        } else {
          ball.style.transition = "all 0.25s ease-out";
          ball.style.left = "70%";
          if (fieldHint) {
            fieldHint.innerText = "Dot ball, solid block.";
            fieldHint.className = "field-hint text-green";
          }
        }

        setTimeout(() => {
          if (spark) spark.style.transform = "translate(50%, -50%) scale(0)";
          if (trajectory) trajectory.style.opacity = "0";
          if (callback) callback();
        }, 750);
      }, 400);
    }, 50);
  };

  const playCommentaryVoice = (text, outcome) => {
    speakCommentary({
      text,
      outcome,
      languageId: voiceLanguage,
      speechRate,
      ttsEnabled,
      useAiVoice,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const applyBallResultUI = (outcome, commentary, victory) => {
    setCommentaryText(commentary);
    setCommentaryHighlightForOutcome(outcome);
    playCommentaryVoice(commentary, outcome);
    playOutcomeSounds(outcome, sfxEnabled);
    adjustCrowdMeter(outcome);
    handleVictory(victory);
  };

  const handleBowlBall = async (outcome) => {
    if (!matchId) return;
    if (match?.status && match.status !== "active") {
      triggerToast("Match completed! Reset scoreboard to play another over.");
      return;
    }

    triggerVisualFieldAnimation(outcome, async () => {
      try {
        const res = await api.bowlBall(matchId, { outcome });
        if (res.apiLog) {
          logMernRequest(
            res.apiLog.method,
            res.apiLog.endpoint,
            res.apiLog.payload,
            res.apiLog.response
          );
        } else {
          logMernRequest(
            "POST",
            `/api/matches/${matchId}/balls`,
            { outcome },
            res
          );
        }
        syncFromMatch(res.match, res.probabilities);
        applyBallResultUI(res.outcome, res.commentary, res.victory);
      } catch (err) {
        triggerToast(err.message);
        setApiError(err.message);
      }
    });
  };

  const handlePlayBattingShot = async (shotType) => {
    if (!matchId) return;
    if (match?.status && match.status !== "active") {
      triggerToast("Match completed! Reset scoreboard to play another over.");
      return;
    }

    try {
      const res = await api.bowlBall(matchId, { shotType });
      if (res.apiLog) {
        logMernRequest(
          res.apiLog.method,
          res.apiLog.endpoint,
          res.apiLog.payload,
          res.apiLog.response
        );
      } else {
        logMernRequest(
          "POST",
          `/api/matches/${matchId}/balls`,
          { shotType },
          res
        );
      }

      triggerVisualFieldAnimation(res.outcome, () => {
        syncFromMatch(res.match, res.probabilities);
        applyBallResultUI(res.outcome, res.commentary, res.victory);
      });
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const handleLoadScenario = async (sc) => {
    if (!matchId) return;
    try {
      const res = await api.updateSetup(matchId, { loadScenario: sc });
      logMernRequest(
        "PATCH",
        `/api/matches/${matchId}/setup`,
        { loadScenario: sc },
        res
      );
      syncFromMatch(res.match);
      setCommentaryHighlight("");
      setWagonWheel([]);
      triggerToast(`MERN API loaded scenario: ${sc}`);
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const handleResetAll = async () => {
    if (!matchId) return;
    try {
      const scenario = match?.scenario || "death";
      const res = await api.resetMatch(matchId, scenario);
      logMernRequest(
        "POST",
        `/api/matches/${matchId}/reset`,
        { scenario },
        res
      );
      syncFromMatch(res.match);
      setCommentaryHighlight("");
      setShowVictoryModal(false);
      triggerToast("Match scoreboard reset via Express API!");
    } catch (err) {
      triggerToast(err.message);
    }
  };

  const handleSendChatMessage = async (text) => {
    if (!text.trim() || !matchId) return;

    setChatMessages((prev) => [...prev, { sender: "user", text }]);
    setCustomPrompt("");
    setIsAgentTyping(true);

    setTimeout(() => {
      const listEl = document.getElementById("chat-msg-list");
      if (listEl) listEl.scrollTop = listEl.scrollHeight;
    }, 60);

    try {
      const res = await api.chat(matchId, text);
      logMernRequest("POST", `/api/chat/${matchId}`, { message: text }, res);

      setIsAgentTyping(false);
      setChatMessages((prev) => [...prev, { sender: "agent", text: res.reply }]);
      playSynthSound("whistle", sfxEnabled);

      if (res.action?.type === "sfx" && res.action.sound) {
        playSynthSound(res.action.sound, sfxEnabled);
      }

      syncFromMatch(res.match);

      if (res.ballResult) {
        const { outcome, commentary, victory } = res.ballResult;
        triggerVisualFieldAnimation(outcome, () => void 0);
        applyBallResultUI(outcome, commentary, victory);
      }

      setTimeout(() => {
        const listEl = document.getElementById("chat-msg-list");
        if (listEl) listEl.scrollTop = listEl.scrollHeight;
      }, 60);
    } catch (err) {
      setIsAgentTyping(false);
      setChatMessages((prev) => [
        ...prev,
        { sender: "agent", text: `API error: ${err.message}` },
      ]);
    }
  };

  const handleQuickPromptClick = (type) => {
    let val = "";
    if (type === "dhoni") val = "MS Dhoni six";
    else if (type === "kohli") val = "Virat Kohli cover drive four";
    else val = "Jasprit Bumrah yorker wicket";
    handleSendChatMessage(val);
  };

  const stopLiveMatchPolling = () => {
    if (livePollTimer.current) {
      clearInterval(livePollTimer.current);
      livePollTimer.current = null;
    }
  };

  const executeLivePolledBall = async (outcome, curRuns, curWickets, curOvers, desc) => {
    if (!matchId) return;
    try {
      const res = await api.liveBall(matchId, {
        outcome,
        score: curRuns,
        wickets: curWickets,
        overs: curOvers,
        desc,
      });
      logMernRequest(
        "POST",
        `/api/matches/${matchId}/live-ball`,
        { outcome, score: curRuns, wickets: curWickets, overs: curOvers, desc },
        res
      );

      triggerVisualFieldAnimation(outcome, () => {
        syncFromMatch(res.match);
        applyBallResultUI(res.outcome, res.commentary, null);
      });
    } catch (err) {
      console.error("Live ball error:", err);
    }
  };

  const pollLiveMatchesData = async (overrideMatchId) => {
    const matchGuid = overrideMatchId !== undefined ? overrideMatchId : selectedLiveMatch;
    if (matchGuid === "demo") {
      const timeline = demoTimelineRef.current;
      if (liveDemoIndex.current >= timeline.length) {
        setLiveConnectionStatus(
          "Demo match completed! Restarting Simulated Broadcaster..."
        );
        liveDemoIndex.current = 0;
        return;
      }
      const curr = timeline[liveDemoIndex.current];
      liveDemoIndex.current += 1;
      executeLivePolledBall(
        curr.outcome,
        curr.score,
        curr.wickets,
        curr.overs,
        `Simulated Live Feed: ${curr.desc}`
      );
      return;
    }

    try {
      // Hit our own highly stable Express REST snapshot of matches instead of direct corsproxy XML
      const res = await api.liveMatches();
      const list = res.matches || [];
      
      const foundMatch = list.find((m) => m.guid === matchGuid);
      if (!foundMatch) {
        setLiveConnectionStatus("Selected match went offline or completed.");
        return;
      }

      const foundTitle = foundMatch.title;

      if (foundTitle === lastScoreString.current) {
        setLiveConnectionStatus(
          "Polling live feed... awaiting next ball delivery."
        );
        return;
      }

      lastScoreString.current = foundTitle;
      setLiveConnectionStatus(
        "Live Scoreboard Updated! Broadcaster evaluating details..."
      );

      const parsed = parseESPNLiveTitle(foundTitle);
      if (!parsed) return;

      if (lastRuns.current === null) {
        lastRuns.current = parsed.runs;
        lastWickets.current = parsed.wickets;
        lastOvers.current = parsed.overs;
        triggerToast(`Connected live tracking to ${parsed.team}!`);
        
        // Exciting live commentary intro welcome statement
        const welcomeDesc = `CricAI tuned in live to ${parsed.team}! Currently at ${parsed.runs} runs for ${parsed.wickets} wickets in ${parsed.overs} overs. Broadcast microphone is active!`;
        executeLivePolledBall("DOT", parsed.runs, parsed.wickets, parsed.overs, welcomeDesc);
        return;
      }

      let outcome = "DOT";
      const runsDiff = parsed.runs - lastRuns.current;
      const wicketDiff = parsed.wickets - lastWickets.current;
      const oversDiff = parsed.overs - lastOvers.current;

      if (wicketDiff > 0) outcome = "WICKET";
      else if (runsDiff === 6) outcome = "SIX";
      else if (runsDiff === 4) outcome = "FOUR";
      else if (runsDiff > 0 && runsDiff <= 3) outcome = "RUNS";
      else if (runsDiff === 1 && oversDiff === 0) outcome = "EXTRA";
      else if (runsDiff === 0 && oversDiff > 0) outcome = "DOT";

      lastRuns.current = parsed.runs;
      lastWickets.current = parsed.wickets;
      lastOvers.current = parsed.overs;

      executeLivePolledBall(
        outcome,
        parsed.runs,
        parsed.wickets,
        parsed.overs,
        `Real match update for ${parsed.team}`
      );
    } catch (e) {
      console.error("Live match poll error:", e);
    }
  };

  const startLiveMatchPolling = (overrideMatchId) => {
    stopLiveMatchPolling();
    lastScoreString.current = "";
    lastRuns.current = null;
    lastWickets.current = null;
    lastOvers.current = null;
    liveDemoIndex.current = 0;
    setLiveConnectionStatus(
      "Live Broadcaster link active. Listening for match events..."
    );
    // Instant execution on selection!
    pollLiveMatchesData(overrideMatchId);
    livePollTimer.current = setInterval(() => {
      pollLiveMatchesData();
    }, 9000);
  };

  const toggleLiveBroadcasting = () => {
    if (isLiveBroadcasting) {
      stopLiveMatchPolling();
      setIsLiveBroadcasting(false);
      setLiveConnectionStatus("Live Broadcaster paused. Click resume to connect.");
      triggerToast("Live Commentary Broadcaster paused!");
    } else {
      setIsLiveBroadcasting(true);
      startLiveMatchPolling();
      triggerToast("Live Commentary Broadcaster resumed!");
    }
  };

  const triggerFetchLiveMatches = async () => {
    setLiveConnectionStatus("Fetching active live matches from Cricinfo...");
    try {
      const res = await api.liveMatches();
      logMernRequest("GET", "/api/live/matches", "{}", res);
      const list = res.matches || [];
      setLiveMatches(list);
      if (list.length === 0) {
        setLiveConnectionStatus(
          "No active matches. Running Simulated Live Broadcaster!"
        );
      } else {
        setLiveConnectionStatus(
          `Connected. Loaded ${list.length} live matches.`
        );
      }
    } catch (e) {
      console.warn(e);
      setLiveConnectionStatus(
        "Server busy. Simulated Live Broadcaster active!"
      );
    }
  };

  const handleSwitchMode = async (mode) => {
    setPlayMode(mode);
    stopLiveMatchPolling();

    if (mode === "live") {
      try {
        const demoRes = await api.demoTimeline();
        logMernRequest("GET", "/api/live/demo-timeline", "{}", demoRes);
        demoTimelineRef.current = demoRes.timeline || [];
      } catch {
        demoTimelineRef.current = [];
      }
      triggerFetchLiveMatches();
      setSelectedLiveMatch("demo");
      setTimeout(() => startLiveMatchPolling(), 300);
    }

    triggerToast(
      `Mode switched to: ${
        mode === "free"
          ? "Free Play"
          : mode === "game"
            ? "Batting Game"
            : "Live Broadcast"
      }`
    );
  };

  const handleSelectMatchChange = (e) => {
    setSelectedLiveMatch(e.target.value);
    setTimeout(() => startLiveMatchPolling(), 100);
  };

  const patchSetup = async (body) => {
    if (!matchId) return;
    try {
      const res = await api.updateSetup(matchId, body);
      logMernRequest("PATCH", `/api/matches/${matchId}/setup`, body, res);
      syncFromMatch(res.match);
    } catch (err) {
      triggerToast(err.message);
    }
  };

  useEffect(() => {
    preloadBrowserVoices();
    setTimeout(preloadBrowserVoices, 800);

    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const status = await api.inningsStatus();
        logMernRequest("GET", "/api/innings/status", "{}", status);

        const created = await api.createMatch("death");
        logMernRequest(
          "POST",
          "/api/matches",
          { scenario: "death" },
          created
        );

        const id = created.match.id || created.match._id;
        setMatchId(id);
        setDbMode(created.dbMode || "mongodb");
        syncFromMatch(created.match, computeWinProbabilities(created.match));

        const full = await api.getMatch(id);
        logMernRequest("GET", `/api/matches/${id}`, "{}", full);
        syncFromMatch(full.match, full.probabilities);
        // Load demo matches timeline
        try {
          const demoRes = await api.demoTimeline();
          demoTimelineRef.current = demoRes.timeline || [];
        } catch {
          demoTimelineRef.current = [];
        }
        // Fetch matches and start live polling automatically
        triggerFetchLiveMatches();
        startLiveMatchPolling();
      } catch (err) {
        setApiError(err.message);
        triggerToast(`MERN API error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    })();

    return () => stopLiveMatchPolling();
  }, []);

  const probs = getWinProbabilities();
  const score = match?.score ?? 0;
  const wickets = match?.wickets ?? 0;
  const overs = match?.overs ?? 0;
  const target = match?.target ?? 0;
  const scenario = match?.scenario ?? "death";
  const striker = match?.striker ?? "Virat Kohli";
  const bowler = match?.bowler ?? "Jasprit Bumrah";

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-banner">
          <i className="fas fa-spinner fa-spin"></i> Connecting to CricAI MERN
          API...
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-area">
          <span className="live-tag">MERN HACKATHON PRO</span>
          <h1>
            Cric<span>AI Pro</span>
          </h1>
          <p className="tagline">
            MERN Stack · MongoDB · Express · React · Node
          </p>
        </div>
        <div className="header-controls">
          <button
            className={`control-btn ${ttsEnabled ? "active" : ""}`}
            onClick={() => {
              const next = !ttsEnabled;
              setTtsEnabled(next);
              if (!next) stopCommentarySpeech();
            }}
          >
            <i
              className={
                ttsEnabled ? "fas fa-volume-up" : "fas fa-volume-mute"
              }
            ></i>
            <span>Voice: {ttsEnabled ? "ON" : "OFF"}</span>
          </button>
          <button
            className={`control-btn ${sfxEnabled ? "active" : ""}`}
            onClick={() => setSfxEnabled(!sfxEnabled)}
          >
            <i className="fas fa-music"></i>
            <span>SFX: {sfxEnabled ? "ON" : "OFF"}</span>
          </button>
          <button
            className="control-btn"
            onClick={handleResetAll}
            title="Reset match scoreboard via REST API"
          >
            <i className="fas fa-sync"></i>
            <span>Reset scoreboard</span>
          </button>
          <button
            className="control-btn highlight-gold"
            onClick={() => setShowJudgeModal(true)}
          >
            <i className="fas fa-award"></i>
            <span>Judge&apos;s Spec</span>
          </button>
        </div>
      </header>

      {apiError && (
        <div className="problem-banner" style={{ borderColor: "var(--neon-red)" }}>
          <div className="problem-banner-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="problem-banner-text">
            <span className="problem-label">API CONNECTION</span>
            <p>{apiError} — ensure Express server is running on port 5000.</p>
          </div>
        </div>
      )}

      <main className="arena-grid">
        <section className="left-panel">
          {/* 📡 CRICINFO LIVE BROADCASTER DESK */}
          <div className="card live-match-controls-card" style={{ borderColor: "rgba(0, 210, 255, 0.25)" }}>
            <div className="card-header">
              <h2>
                <i className="fas fa-satellite-dish text-blue" style={{ color: "var(--neon-blue)", marginRight: "8px" }}></i>
                CRICINFO LIVE BROADCASTER DESK
              </h2>
              <button
                className={`control-btn ${isLiveBroadcasting ? "active" : ""}`}
                onClick={toggleLiveBroadcasting}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                <i className={isLiveBroadcasting ? "fas fa-pause" : "fas fa-play"}></i>
                <span>{isLiveBroadcasting ? "Pause Broadcast" : "Resume Broadcast"}</span>
              </button>
            </div>
            <div className="live-match-setup" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="batting-instruction" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span>Tune in to Real-World Matches for Live Commentary:</span>
                <span className="live-pulse-green" style={{ background: isLiveBroadcasting ? "var(--neon-green)" : "#64748b", boxShadow: isLiveBroadcasting ? "0 0 10px var(--neon-green)" : "none" }}></span>
              </div>
              <div className="live-select-row" style={{ display: "flex", gap: "10px", width: "100%" }}>
                <select
                  value={selectedLiveMatch}
                  onChange={handleSelectMatchChange}
                  style={{
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    padding: "10px 14px",
                    fontFamily: "var(--font-primary)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    outline: "none",
                    flex: 1,
                  }}
                >
                  <option value="demo">
                    Simulated Broadcast: RCB vs CSK (IPL Live Derby)
                  </option>
                  {liveMatches.map((m) => (
                    <option key={m.guid} value={m.guid}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <button
                  className="control-btn"
                  title="Force Reload Matches List"
                  onClick={triggerFetchLiveMatches}
                  style={{ padding: "10px 14px" }}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
              <div className="live-status-row" style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.2)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="live-pulse-green" style={{ background: isLiveBroadcasting ? "var(--neon-green)" : "#64748b", boxShadow: isLiveBroadcasting ? "0 0 8px var(--neon-green)" : "none" }}></span>
                <span className="status-msg" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1" }}>
                  {liveConnectionStatus}
                </span>
              </div>
            </div>
          </div>

          {/* 1. CRICAI COMMENTARY BOX */}
          <div className="card commentary-card">
            <div className="card-header">
              <div className="live-mic-title">
                <span className="pulsing-red-dot"></span>
                <h2>CRICAI COMMENTARY BOX</h2>
              </div>
              <span className="mic-status">
                <i className="fas fa-microphone"></i> ON AIR
              </span>
            </div>
            <div className="commentary-screen-outer">
              <div className="commentary-screen">
                <p className={commentaryHighlight || "placeholder-text"}>
                  {commentaryText}
                </p>
              </div>
            </div>
            <div
              className={`audio-wave-container ${isSpeaking ? "speaking" : ""}`}
            >
              {[...Array(15)].map((_, i) => (
                <div key={i} className="wave-bar"></div>
              ))}
            </div>

            {/* Quick Simulate Ball Outcome buttons inside commentary card */}
            <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "18px" }}>
              <div className="batting-instruction" style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Simulate Ball Outcome:</span>
                <span className="live-pulse-green"></span>
              </div>
              <div className="outcome-controls">
                <button className="outcome-btn btn-six" onClick={() => handleBowlBall("SIX")}>
                  <span className="btn-icon">⚡</span>
                  <span className="btn-text">6 Runs</span>
                </button>
                <button className="outcome-btn btn-four" onClick={() => handleBowlBall("FOUR")}>
                  <span className="btn-icon">🔥</span>
                  <span className="btn-text">4 Runs</span>
                </button>
                <button className="outcome-btn btn-wicket" onClick={() => handleBowlBall("WICKET")}>
                  <span className="btn-icon">💀</span>
                  <span className="btn-text">Wicket</span>
                </button>
                <button className="outcome-btn btn-dot" onClick={() => handleBowlBall("DOT")}>
                  <span className="btn-icon">🎯</span>
                  <span className="btn-text">Dot Ball</span>
                </button>
                <button className="outcome-btn btn-runs" onClick={() => handleBowlBall("RUNS")}>
                  <span className="btn-icon">🏃</span>
                  <span className="btn-text">1-3 Runs</span>
                </button>
                <button className="outcome-btn btn-extra" onClick={() => handleBowlBall("EXTRA")}>
                  <span className="btn-icon">⚠️</span>
                  <span className="btn-text">Wide / No Ball</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. CRICAI AI COPILOT AGENT */}
          <div className="card custom-commentary-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-robot text-blue"></i> CRICAI AI COPILOT AGENT
              </h2>
            </div>
            <div className="agent-chat-box">
              <div className="chat-box-messages" id="chat-msg-list">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`chat-msg ${msg.sender}`}>
                    {msg.text}
                  </div>
                ))}
                {isAgentTyping && (
                  <div className="chat-msg agent typing">
                    <span
                      className="live-pulse-green"
                      style={{ display: "inline-block", marginRight: "6px" }}
                    ></span>
                    CricAI is analyzing stadium data...
                  </div>
                )}
              </div>

              <div className="prompt-input-wrapper">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatMessage(customPrompt);
                  }}
                  placeholder="e.g. Dhoni six, Bumrah wicket, play dhol beats..."
                />
                <button onClick={() => handleSendChatMessage(customPrompt)}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>

              <div className="quick-prompts">
                <button
                  className="quick-prompt-btn"
                  onClick={() => handleQuickPromptClick("dhoni")}
                >
                  Dhoni Helicopter Six! 🚁
                </button>
                <button
                  className="quick-prompt-btn"
                  onClick={() => handleQuickPromptClick("kohli")}
                >
                  Kohli Classic Drive! 🏏
                </button>
                <button
                  className="quick-prompt-btn"
                  onClick={() => handleQuickPromptClick("bumrah")}
                >
                  Bumrah Lethal Yorker! 💀
                </button>
              </div>
            </div>
          </div>

          {/* 3. INNING OVER FEED (BALL-BY-BALL) */}
          <div className="card feed-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-stream"></i> INNING OVER FEED (BALL-BY-BALL)
              </h2>
              <span className="feed-count">
                {feedCount} Ball{feedCount !== 1 ? "s" : ""} Bowled
              </span>
            </div>
            <div className="feed-list" style={{ maxHeight: "350px", overflowY: "auto" }}>
              {feedHistory.length === 0 ? (
                <div className="empty-feed-placeholder">
                  <i className="fas fa-history"></i>
                  <p>
                    Awaiting game action. Start simulating or chatting to construct the
                    live match inning history!
                  </p>
                </div>
              ) : (
                feedHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`feed-item outcome-${item.outcome.toLowerCase()}`}
                  >
                    <div className="feed-item-header">
                      <span className="feed-ball-no">Ball {item.ballNo}</span>
                      <span
                        className={`feed-badge badge-${item.outcome.toLowerCase()}`}
                      >
                        {item.outcome}
                      </span>
                    </div>
                    <div className="feed-players">
                      {item.batsman} <span>vs</span> {item.bowler}
                    </div>
                    <div className="feed-commentary-text">{item.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="right-panel">
          {/* 4. CRICAI VOICE & STYLE */}
          <div className="card voice-panel-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-sliders-h"></i> CRICAI VOICE & STYLE
              </h2>
            </div>
            <div className="voice-controls-grid">
              <div className="control-row">
                <label>
                  <i className="fas fa-globe-asia"></i> Commentary Voice Language
                </label>
                <select
                  value={voiceLanguage}
                  onChange={(e) => {
                    setVoiceLanguage(e.target.value);
                    localStorage.setItem("cricai-voice-lang", e.target.value);
                  }}
                >
                  {["India", "International"].map((group) => (
                    <optgroup key={group} label={group}>
                      {VOICE_LANGUAGE_OPTIONS.filter((o) => o.group === group).map(
                        (opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        )
                      )}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="control-row">
                <label>AI Neural Voice (Microsoft Edge TTS)</label>
                <div className="voice-engine-toggles">
                  <button
                    type="button"
                    className={`mode-btn ${useAiVoice ? "active" : ""}`}
                    onClick={() => {
                      setUseAiVoice(true);
                      localStorage.setItem("cricai-ai-voice", "true");
                    }}
                  >
                    AI Voice ON
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${!useAiVoice ? "active" : ""}`}
                    onClick={() => {
                      setUseAiVoice(false);
                      localStorage.setItem("cricai-ai-voice", "false");
                    }}
                  >
                    Browser Only
                  </button>
                  <button
                    type="button"
                    className="control-btn"
                    onClick={() =>
                      playCommentaryVoice(
                        "Namaste dosto! CricAI live commentary test — yeh awaaz aapki chosen language mein bol rahi hai!",
                        "FOUR"
                      )
                    }
                  >
                    <i className="fas fa-play"></i> Test Voice
                  </button>
                </div>
              </div>
              <div className="control-row">
                <label>Commentary Style</label>
                <select
                  value={commentaryStyle}
                  onChange={(e) => {
                    setCommentaryStyle(e.target.value);
                    patchSetup({ commentaryStyle: e.target.value });
                  }}
                >
                  <option value="filmy">
                    Bollywood Masala Drama (Filmy)
                  </option>
                  <option value="sarcastic">
                    Desi Sarcasm & Crowd Fun
                  </option>
                  <option value="aggressive">
                    Aggressive High-Voltage
                  </option>
                </select>
              </div>
              <div className="control-row">
                <label>Speech Rate (Speed)</label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) =>
                      setSpeechRate(parseFloat(e.target.value))
                    }
                  />
                  <span id="speed-val">{speechRate.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. STADIUM SOUNDBOARD & CHEER */}
          <div className="card atmosphere-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-volume-up"></i> STADIUM SOUNDBOARD & CHEER
              </h2>
            </div>
            <div className="soundboard-grid">
              <button
                className="sfx-btn"
                onClick={() => playSynthSound("cheer", sfxEnabled)}
              >
                <i className="fas fa-users"></i>
                <span>Stadium Roar</span>
              </button>
              <button
                className="sfx-btn"
                onClick={() => playSynthSound("horn", sfxEnabled)}
              >
                <i className="fas fa-bullhorn"></i>
                <span>IPL Trumpet</span>
              </button>
              <button
                className="sfx-btn"
                onClick={() => playSynthSound("dhol", sfxEnabled)}
              >
                <i className="fas fa-drum"></i>
                <span>Desi Dhol Beats</span>
              </button>
              <button
                className="sfx-btn"
                onClick={() => playSynthSound("bat", sfxEnabled)}
              >
                <i className="fas fa-hammer"></i>
                <span>Bat Impact</span>
              </button>
              <button
                className="sfx-btn"
                onClick={() => playSynthSound("aww", sfxEnabled)}
              >
                <i className="fas fa-heart-broken"></i>
                <span>Crowd Sigh</span>
              </button>
              <button
                className="sfx-btn"
                onClick={() => playSynthSound("whistle", sfxEnabled)}
              >
                <i className="fas fa-arrow-circle-right"></i>
                <span>Umpire Whistle</span>
              </button>
            </div>
            <div className="crowd-meter-wrapper">
              <span className="meter-label">Stadium Crowd Hype Meter</span>
              <div className="meter-track">
                <div
                  className="meter-fill"
                  style={{ width: `${crowdMeter.fill}%` }}
                ></div>
              </div>
              <div className="meter-stats">
                <span id="crowd-percentage">{crowdMeter.fill}% Hyped</span>
                <span id="crowd-status">{crowdMeter.status}</span>
              </div>
            </div>
          </div>

          {/* 6. MERN STACK DATABASE & REST API LEDGER */}
          <div className="card feed-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-database text-green"></i> MERN STACK REST API LEDGER
              </h2>
              <span
                className="feed-count"
                style={{
                  borderColor: "var(--neon-green)",
                  color: "var(--neon-green)",
                }}
              >
                {dbMode === "mongodb" ? "MongoDB Active" : "Memory Fallback"}
              </span>
            </div>
            <div className="mern-terminal" style={{ maxHeight: "350px", overflowY: "auto" }}>
              {mernLogs.length === 0 ? (
                <div className="empty-feed-placeholder">
                  <p>API ledger will populate as Express endpoints are called.</p>
                </div>
              ) : (
                mernLogs.map((log, idx) => (
                  <div key={idx} className="mern-log-item">
                    <div className="mern-log-header">
                      <div>
                        <span className={`mern-method ${log.method}`}>
                          {log.method}
                        </span>
                        <span className="mern-endpoint">{log.endpoint}</span>
                      </div>
                      <span className="mern-time">{log.timestamp}</span>
                    </div>
                    <div className="mern-details">
                      <div className="mern-payload">
                        <span className="mern-payload-label">
                          Request Payload:
                        </span>{" "}
                        {log.payload}
                      </div>
                      <div className="mern-response">
                        <span className="mern-response-label">
                          Response Data:
                        </span>{" "}
                        {log.response}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Global Live Scores — Real matches from cricketdata.org ── */}
      <section style={{ padding: "0 16px 24px" }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", color: "#f9fafb", fontWeight: 700 }}>
              <i className="fas fa-satellite-dish" style={{ color: "#ef4444", marginRight: "8px" }}></i>
              Live Scores — Real Matches Worldwide
            </h2>
          </div>
          <LiveScorePanel />
        </div>
      </section>

      {showVictoryModal && (
        <div className="modal-overlay">
          <div className="modal-card victory-card-glow">
            <div className="modal-header center-title">
              <h2 className="animate-bounce">
                <i className="fas fa-trophy text-gold"></i> MATCH FINISHED!
              </h2>
            </div>
            <div className="modal-body text-center">
              <h1>{victoryData.title}</h1>
              <p className="commentary-quote">{victoryData.message}</p>
              <div className="audio-wave-container speaking victory-eq">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            </div>
            <div className="modal-footer center-footer">
              <button
                className="action-btn btn-gold-neon"
                onClick={() => {
                  setShowVictoryModal(false);
                  handleResetAll();
                }}
              >
                Play Another Inning
              </button>
            </div>
          </div>
        </div>
      )}

      {showJudgeModal && (
        <div className="modal-overlay">
          <div className="modal-card modal-card-wide">
            <div className="modal-header">
              <h2>
                <i className="fas fa-award"></i> HACKATHON TECH SPEC SHEET
              </h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowJudgeModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="spec-grid">
                <div className="spec-section">
                  <div className="spec-icon">
                    <i className="fas fa-layer-group"></i>
                  </div>
                  <h3>1. MERN Stack Architecture</h3>
                  <p>
                    MongoDB persists matches, ball logs, wagon wheel vectors, and
                    feed history. Express REST API serves /api/matches, /api/chat,
                    and /api/live. React 18 + Vite client consumes real endpoints.
                  </p>
                  <span className="spec-tag">
                    MongoDB · Express · React · Node · Vite
                  </span>
                </div>
                <div className="spec-section">
                  <div className="spec-icon">
                    <i className="fas fa-satellite-dish"></i>
                  </div>
                  <h3>2. ESPN Live XML Broadcaster</h3>
                  <p>
                    Real-world ESPN Cricinfo RSS XML polling via CORS proxy.
                    Client-side parseESPNLiveTitle regex matches server logic.
                    Demo timeline from /api/live/demo-timeline.
                  </p>
                  <span className="spec-tag">
                    corsproxy.io · RSS XML · Express Live Routes
                  </span>
                </div>
                <div className="spec-section">
                  <div className="spec-icon">
                    <i className="fas fa-wave-square"></i>
                  </div>
                  <h3>3. Procedural Audio Synthesis</h3>
                  <p>
                    Zero audio assets. Dhol, IPL trumpets, crowd roars, bat
                    impacts, and whistles synthesized live via Web Audio API
                    oscillators and noise filters.
                  </p>
                  <span className="spec-tag">
                    Web Audio API · 0 KB Assets · 5 Instruments
                  </span>
                </div>
                <div className="spec-section">
                  <div className="spec-icon">
                    <i className="fas fa-robot"></i>
                  </div>
                  <h3>4. NLP Copilot via Express Chat API</h3>
                  <p>
                    POST /api/chat/:matchId runs server-side fuzzy NLP. Hinglish
                    intents trigger bowl actions, SFX, stats, and player updates
                    persisted to MongoDB.
                  </p>
                  <span className="spec-tag">
                    Node NLP Agent · Hinglish · REST Chat
                  </span>
                </div>
                <div className="spec-section">
                  <div className="spec-icon">
                    <i className="fas fa-bullseye"></i>
                  </div>
                  <h3>5. Wagon Wheel Shot Analytics</h3>
                  <p>
                    Server computes vector angle + length per ball. Stored in
                    MongoDB match document and rendered as neon trajectory lines
                    on the 2D pitch.
                  </p>
                  <span className="spec-tag">
                    MongoDB Arrays · CSS Vectors · React State
                  </span>
                </div>
                <div className="spec-section">
                  <div className="spec-icon">
                    <i className="fas fa-database"></i>
                  </div>
                  <h3>6. Real MERN API Ledger</h3>
                  <p>
                    Every Express call logs method, endpoint, payload, and JSON
                    response in the live terminal — not simulated mock data.
                    Ball POST returns structured apiLog metadata.
                  </p>
                  <span className="spec-tag">
                    MongoDB Atlas · Express REST · Vite Proxy
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="tech-stack-pills">
                <span className="pill pill-react">
                  <i className="fab fa-react"></i> React 18
                </span>
                <span className="pill pill-js">
                  <i className="fab fa-node-js"></i> Node + Express
                </span>
                <span className="pill pill-db">
                  <i className="fas fa-database"></i> MongoDB
                </span>
                <span className="pill pill-audio">
                  <i className="fas fa-music"></i> Web Audio
                </span>
                <span className="pill pill-tts">
                  <i className="fas fa-microphone"></i> Speech API
                </span>
              </div>
              <p
                style={{
                  marginTop: "12px",
                  color: "#64748b",
                  fontSize: "0.82rem",
                }}
              >
                Vite dev server + Express API. MongoDB Atlas or in-memory
                fallback. No commentary API keys required. 🚀
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>
          &copy; 2026 CricAI Pro Arena. MERN Stack · MongoDB · Express · React
          · Node
        </p>
        <p className="small-text">
          React 18 + Vite · Express REST · Web Audio Synthesizer.
        </p>
      </footer>

      <div id="voice-toast" className="toast">
        <i className="fas fa-bell"></i>
        <span id="toast-text">Voice commentary active!</span>
      </div>
    </div>
  );
}
