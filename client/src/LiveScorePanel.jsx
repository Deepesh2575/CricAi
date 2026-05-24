/**
 * LiveScorePanel.jsx
 * Real-time SSE-powered REAL live cricket scores panel.
 * Shows international + domestic matches from Cricinfo / CricAPI.
 */

import { useState, useEffect, useRef } from "react";
import { api } from "./api/client.js";

const MATCH_TYPE_COLORS = {
  T20:  { bg: "#7c3aed", glow: "#7c3aed" },
  T20I: { bg: "#6d28d9", glow: "#6d28d9" },
  ODI:  { bg: "#0284c7", glow: "#0ea5e9" },
  Test: { bg: "#92400e", glow: "#f59e0b" },
  IT20: { bg: "#059669", glow: "#10b981" },
};

function getMatchTypeStyle(type) {
  return MATCH_TYPE_COLORS[type] || { bg: "#4b5563", glow: "#6b7280" };
}

function MatchTypeTag({ type }) {
  const { bg } = getMatchTypeStyle(type);
  return (
    <span style={{
      background: `${bg}28`,
      color: bg,
      border: `1px solid ${bg}55`,
      padding: "2px 7px",
      borderRadius: "5px",
      fontSize: "0.62rem",
      fontWeight: 800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      flexShrink: 0,
    }}>
      {type}
    </span>
  );
}

function TeamChip({ name, shortName, isBatting, runs, wickets, overs }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 10px",
      borderRadius: "8px",
      background: isBatting ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isBatting ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)"}`,
      transition: "all 0.3s ease",
    }}>
      {/* Team abbreviation badge */}
      <div style={{
        minWidth: "38px",
        height: "38px",
        borderRadius: "8px",
        background: isBatting
          ? "linear-gradient(135deg, #059669, #10b981)"
          : "linear-gradient(135deg, #374151, #4b5563)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.65rem",
        fontWeight: 900,
        color: "#fff",
        letterSpacing: "0.05em",
        boxShadow: isBatting ? "0 0 10px rgba(16,185,129,0.4)" : "none",
        flexShrink: 0,
      }}>
        {shortName || name?.slice(0, 3).toUpperCase() || "???"}
      </div>

      {/* Name + score */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: isBatting ? "#f0fdf4" : "#9ca3af",
          fontSize: "0.75rem",
          fontWeight: 700,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {name}
          {isBatting && (
            <span style={{
              marginLeft: "6px",
              fontSize: "0.6rem",
              color: "#10b981",
              fontWeight: 600,
            }}>● LIVE</span>
          )}
        </div>
        {(runs !== undefined && runs !== null) ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "1px" }}>
            <span style={{
              color: isBatting ? "#fff" : "#d1d5db",
              fontWeight: 900,
              fontSize: isBatting ? "1.15rem" : "0.9rem",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}>
              {runs}/{wickets}
            </span>
            {overs > 0 && (
              <span style={{ color: "#6b7280", fontSize: "0.68rem" }}>
                ({overs} ov)
              </span>
            )}
          </div>
        ) : (
          <div style={{ color: "#6b7280", fontSize: "0.72rem", marginTop: "1px" }}>Yet to bat</div>
        )}
      </div>
    </div>
  );
}

function RunRateRow({ crr, rrr, runsNeeded, overs, maxOvers }) {
  if (!crr && !rrr) return null;

  const oversPlayed = overs || 0;
  const progressPct = maxOvers > 0 ? Math.min(100, (oversPlayed / maxOvers) * 100) : 0;

  return (
    <div style={{ marginTop: "8px" }}>
      {/* Overs progress bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ color: "#6b7280", fontSize: "0.62rem", fontWeight: 600 }}>
          {oversPlayed} / {maxOvers} overs
        </span>
        {runsNeeded !== null && runsNeeded !== undefined && (
          <span style={{ color: "#fbbf24", fontSize: "0.65rem", fontWeight: 700 }}>
            Need {runsNeeded} off {Math.max(0, Math.round((maxOvers - oversPlayed) * 6))} balls
          </span>
        )}
      </div>
      <div style={{
        height: "4px",
        background: "rgba(255,255,255,0.07)",
        borderRadius: "2px",
        overflow: "hidden",
        marginBottom: "6px",
      }}>
        <div style={{
          height: "100%",
          width: `${progressPct}%`,
          background: "linear-gradient(90deg, #10b981, #3b82f6)",
          borderRadius: "2px",
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* Run rates */}
      <div style={{ display: "flex", gap: "8px" }}>
        {crr > 0 && (
          <div style={{
            flex: 1,
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            borderRadius: "6px",
            padding: "4px 8px",
            textAlign: "center",
          }}>
            <div style={{ color: "#60a5fa", fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>CRR</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem" }}>{crr.toFixed(2)}</div>
          </div>
        )}
        {rrr !== null && rrr !== undefined && rrr > 0 && (
          <div style={{
            flex: 1,
            background: rrr > 12 ? "rgba(220,38,38,0.1)" : rrr > 8 ? "rgba(251,191,36,0.08)" : "rgba(16,185,129,0.08)",
            border: `1px solid ${rrr > 12 ? "rgba(220,38,38,0.3)" : rrr > 8 ? "rgba(251,191,36,0.2)" : "rgba(16,185,129,0.2)"}`,
            borderRadius: "6px",
            padding: "4px 8px",
            textAlign: "center",
          }}>
            <div style={{ color: rrr > 12 ? "#f87171" : rrr > 8 ? "#fbbf24" : "#34d399", fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>RRR</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem" }}>{rrr.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match, isNew, isSelected, onSelect }) {
  const [flash, setFlash] = useState(false);
  const prevScore = useRef(match.score);

  useEffect(() => {
    if (match.score !== prevScore.current) {
      setFlash(true);
      prevScore.current = match.score;
      setTimeout(() => setFlash(false), 800);
    }
  }, [match.score]);

  // Build innings data for display
  const innings = match.innings || [];
  const hasInnings = innings.length > 0;

  // Find batting team's innings
  const battingInn = innings.find(i =>
    i.inning?.toLowerCase().includes(match.battingTeam?.toLowerCase()?.split(" ")[0] || "zzz")
  ) || innings[innings.length - 1];

  const bowlingInn = innings.find(i => i !== battingInn) || null;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected
          ? "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0.4) 100%)"
          : flash
            ? "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0.4) 100%)"
            : isNew
              ? "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(0,0,0,0.4) 100%)"
              : "rgba(0,0,0,0.3)",
        border: `1px solid ${
          isSelected ? "rgba(99,102,241,0.5)"
          : flash ? "rgba(16,185,129,0.4)"
          : isNew ? "rgba(37,99,235,0.3)"
          : "rgba(255,255,255,0.06)"}`,
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "8px",
        cursor: onSelect ? "pointer" : "default",
        transition: "border 0.3s ease, background 0.3s ease, transform 0.15s ease",
        transform: isSelected ? "scale(1.01)" : "scale(1)",
      }}
    >
      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
        <div style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: "#ef4444",
          boxShadow: "0 0 6px #ef4444",
          animation: "pulse 1.5s infinite",
          flexShrink: 0,
        }} />
        <MatchTypeTag type={match.matchType || "T20"} />
        <span style={{
          color: "#d1d5db",
          fontWeight: 600,
          fontSize: "0.75rem",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {match.series || match.name || `${match.team1} vs ${match.team2}`}
        </span>
        {isSelected && (
          <span style={{
            fontSize: "0.58rem",
            color: "#818cf8",
            fontWeight: 700,
            background: "rgba(99,102,241,0.2)",
            padding: "2px 6px",
            borderRadius: "4px",
            flexShrink: 0,
          }}>TRACKING</span>
        )}
      </div>

      {/* ── Teams + Scores ── */}
      {hasInnings ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px" }}>
          {innings.map((inn, i) => {
            const isBatting = inn === battingInn || (innings.length === 1);
            return (
              <TeamChip
                key={i}
                name={inn.inning}
                shortName={inn.shortName}
                isBatting={isBatting}
                runs={inn.runs}
                wickets={inn.wickets}
                overs={inn.overs}
              />
            );
          })}
        </div>
      ) : match.score > 0 ? (
        /* Fallback when no innings array — show batting team directly */
        <div style={{ marginBottom: "8px" }}>
          <TeamChip
            name={match.battingTeam || match.team1 || "Batting Team"}
            shortName={match.team1Short}
            isBatting={true}
            runs={match.score}
            wickets={match.wickets}
            overs={match.overs}
          />
          {match.team2 && (
            <div style={{ marginTop: "5px" }}>
              <TeamChip
                name={match.team2}
                shortName={match.team2Short}
                isBatting={false}
              />
            </div>
          )}
        </div>
      ) : (
        /* No score at all */
        <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
          <TeamChip name={match.team1 || "Team A"} shortName={match.team1Short} isBatting={false} />
          <TeamChip name={match.team2 || "Team B"} shortName={match.team2Short} isBatting={false} />
        </div>
      )}

      {/* ── Run rates + progress ── */}
      <RunRateRow
        crr={match.currentRunRate}
        rrr={match.requiredRunRate}
        runsNeeded={match.runsNeeded}
        overs={match.overs}
        maxOvers={match.maxOvers || 20}
      />

      {/* ── Status ── */}
      {match.status && (
        <div style={{
          color: "#fbbf24",
          fontSize: "0.7rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: "7px",
          marginTop: "8px",
          lineHeight: 1.4,
        }}>
          📍 {match.status}
        </div>
      )}

      {/* ── Venue ── */}
      {match.venue && (
        <div style={{ color: "#4b5563", fontSize: "0.65rem", marginTop: "3px" }}>
          🏟️ {match.venue}
        </div>
      )}
    </div>
  );
}

// ─── Setup screen shown when no API key is set ─────────────────────────────
function NoKeyScreen() {
  return (
    <div style={{
      textAlign: "center",
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    }}>
      <div style={{
        width: "56px", height: "56px", borderRadius: "16px",
        background: "linear-gradient(135deg, #1e3a5f, #1e1b4b)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.8rem", boxShadow: "0 0 20px rgba(37,99,235,0.2)",
      }}>🛰️</div>
      <h3 style={{ margin: 0, color: "#f9fafb", fontSize: "0.95rem", fontWeight: 700 }}>
        Live via Cricinfo
      </h3>
      <p style={{ color: "#9ca3af", fontSize: "0.78rem", margin: 0, lineHeight: 1.5, maxWidth: "260px" }}>
        Scores are fetched from ESPNcricinfo.
        For even richer ball-by-ball data, add a <strong style={{ color: "#f9fafb" }}>free CricAPI key</strong>:
      </p>
      <div style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "10px 14px",
        width: "100%",
        textAlign: "left",
        fontFamily: "monospace",
        fontSize: "0.73rem",
        color: "#34d399",
      }}>
        <div style={{ color: "#6b7280", marginBottom: "3px" }}># server/.env</div>
        <div>CRICAPI_KEY=<span style={{ color: "#fbbf24" }}>your_key_here</span></div>
      </div>
      <div style={{
        display: "flex", flexDirection: "column", gap: "4px",
        width: "100%", fontSize: "0.7rem", color: "#6b7280",
      }}>
        <div>✅ 100 free requests/day — no credit card</div>
        <div>✅ International + IPL + domestic</div>
        <div>✅ Ball-by-ball scoring</div>
      </div>
      <a
        href="https://www.cricketdata.org/"
        target="_blank"
        rel="noreferrer"
        style={{
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          color: "#fff",
          padding: "9px 20px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.8rem",
        }}
      >
        Get Free API Key →
      </a>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function LiveScorePanel({ selectedMatchGuid, onMatchSelect }) {
  const [connected, setConnected]       = useState(false);
  const [needsKey, setNeedsKey]         = useState(false);
  const [matches, setMatches]           = useState([]);
  const [newMatchIds, setNewMatchIds]   = useState(new Set());
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [error, setError]               = useState(null);
  const esRef = useRef(null);
  const reconnectTimer = useRef(null);
  const prevMatchIds = useRef(new Set());

  const connect = () => {
    if (esRef.current) esRef.current.close();
    const es = api.connectLiveStream();
    esRef.current = es;

    es.addEventListener("connected", (e) => {
      const d = JSON.parse(e.data);
      setConnected(true);
      setNeedsKey(!d.hasKey);
      setError(null);
    });

    es.addEventListener("no_key", () => {
      setNeedsKey(false); // cricinfo fallback works without a key
    });

    es.addEventListener("live_matches", (e) => {
      const d = JSON.parse(e.data);
      const incoming = d.matches || [];

      const newIds = new Set(
        incoming
          .filter((m) => !prevMatchIds.current.has(m.id || m.guid))
          .map((m) => m.id || m.guid)
      );
      prevMatchIds.current = new Set(incoming.map((m) => m.id || m.guid));

      setMatches(incoming);
      setNewMatchIds(newIds);
      setLastUpdated(new Date());
      setError(null);

      if (newIds.size > 0) {
        setTimeout(() => setNewMatchIds(new Set()), 3000);
      }
    });

    es.addEventListener("score_update", (e) => {
      const d = JSON.parse(e.data);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === d.matchId
            ? { ...m, innings: d.innings, score: d.score, wickets: d.wickets, overs: d.overs, status: d.status }
            : m
        )
      );
      setLastUpdated(new Date());
    });

    es.addEventListener("error", (e) => {
      try {
        const d = JSON.parse(e.data);
        setError(d.message);
      } catch { /* parse fail */ }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      reconnectTimer.current = setTimeout(connect, 6000);
    };
  };

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(reconnectTimer.current);
    };
  }, []);

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div style={{
      background: "rgba(0,0,0,0.45)",
      borderRadius: "16px",
      padding: "16px",
      border: "1px solid rgba(255,255,255,0.07)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", flexShrink: 0 }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: connected ? "#10b981" : "#ef4444",
          boxShadow: connected ? "0 0 8px #10b981" : "0 0 8px #ef4444",
          animation: "pulse 2s infinite",
          flexShrink: 0,
        }} />
        <h3 style={{ margin: 0, color: "#f9fafb", fontSize: "0.9rem", fontWeight: 700, flex: 1 }}>
          🌐 Live Cricket
        </h3>
        <div style={{ textAlign: "right" }}>
          {timeStr && (
            <div style={{ color: "#4b5563", fontSize: "0.6rem" }}>{timeStr}</div>
          )}
          <div style={{
            fontSize: "0.58rem",
            color: connected ? "#10b981" : "#ef4444",
            fontWeight: 700,
            textTransform: "uppercase",
          }}>
            {connected ? "● LIVE" : "○ RECONNECTING"}
          </div>
        </div>
      </div>

      {/* ── No key state ── */}
      {needsKey && <NoKeyScreen />}

      {/* ── Error state ── */}
      {!needsKey && error && (
        <div style={{
          background: "rgba(220,38,38,0.08)",
          border: "1px solid rgba(220,38,38,0.25)",
          borderRadius: "8px",
          padding: "10px 12px",
          color: "#fca5a5",
          fontSize: "0.75rem",
          textAlign: "center",
          marginBottom: "10px",
          flexShrink: 0,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Connecting state ── */}
      {!needsKey && !error && !connected && matches.length === 0 && (
        <div style={{ color: "#4b5563", textAlign: "center", padding: "30px 0", fontSize: "0.82rem" }}>
          <div style={{ fontSize: "1.4rem", marginBottom: "8px", animation: "pulse 1.5s infinite" }}>📡</div>
          Connecting to live feed...
        </div>
      )}

      {/* ── No matches ── */}
      {!needsKey && connected && matches.length === 0 && !error && (
        <div style={{ color: "#4b5563", textAlign: "center", padding: "30px 0", fontSize: "0.82rem" }}>
          <div style={{ fontSize: "1.4rem", marginBottom: "8px" }}>🏏</div>
          No live matches right now.
          <div style={{ fontSize: "0.68rem", marginTop: "5px" }}>Check back during an active match.</div>
        </div>
      )}

      {/* ── Match cards ── */}
      {!needsKey && matches.length > 0 && (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            flexShrink: 0,
          }}>
            <span style={{ color: "#4b5563", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {matches.length} match{matches.length !== 1 ? "es" : ""} live
            </span>
            {selectedMatchGuid && selectedMatchGuid !== "demo" && (
              <span style={{ color: "#818cf8", fontSize: "0.62rem", fontWeight: 600 }}>
                Click a match to track it
              </span>
            )}
          </div>
          {matches.map((m) => (
            <MatchCard
              key={m.id || m.guid}
              match={m}
              isNew={newMatchIds.has(m.id || m.guid)}
              isSelected={selectedMatchGuid && (m.guid === selectedMatchGuid || m.id === selectedMatchGuid)}
              onSelect={onMatchSelect ? () => onMatchSelect(m) : undefined}
            />
          ))}
        </div>
      )}

      {/* ── Footer badge ── */}
      {!needsKey && connected && (
        <div style={{
          marginTop: "10px",
          textAlign: "center",
          fontSize: "0.6rem",
          color: "#1f2937",
          flexShrink: 0,
        }}>
          Cricinfo · CricAPI · Updates every 30s
        </div>
      )}
    </div>
  );
}
