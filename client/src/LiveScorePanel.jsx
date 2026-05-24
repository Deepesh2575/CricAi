/**
 * LiveScorePanel.jsx
 * Real-time SSE-powered REAL live cricket scores panel.
 * Shows international + domestic matches from CricAPI (cricketdata.org).
 * Displays a clean setup screen if CRICAPI_KEY is not configured.
 */

import { useState, useEffect, useRef } from "react";
import { api } from "../api/client.js";

const OUTCOME_COLORS = {
  SIX:    { bg: "#7c3aed", text: "#fff"    },
  FOUR:   { bg: "#2563eb", text: "#fff"    },
  WICKET: { bg: "#dc2626", text: "#fff"    },
  DOT:    { bg: "#374151", text: "#9ca3af" },
  RUNS:   { bg: "#065f46", text: "#6ee7b7" },
  EXTRA:  { bg: "#92400e", text: "#fcd34d" },
};

const MATCH_TYPE_COLORS = {
  T20:  "#7c3aed",
  ODI:  "#0284c7",
  Test: "#92400e",
  IT20: "#059669",
};

function MatchTypeTag({ type }) {
  const color = MATCH_TYPE_COLORS[type] || "#6b7280";
  return (
    <span style={{
      background: `${color}30`,
      color,
      border: `1px solid ${color}60`,
      padding: "1px 7px",
      borderRadius: "4px",
      fontSize: "0.65rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}>
      {type}
    </span>
  );
}

function InningsRow({ inn }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
      <span style={{ color: "#9ca3af", fontSize: "0.72rem", minWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {inn.inning}
      </span>
      <span style={{ color: "#f9fafb", fontWeight: 700, fontSize: "0.9rem" }}>
        {inn.runs}/{inn.wickets}
      </span>
      <span style={{ color: "#6b7280", fontSize: "0.72rem" }}>
        ({inn.overs} ov)
      </span>
    </div>
  );
}

function MatchCard({ match, isNew }) {
  return (
    <div style={{
      background: isNew
        ? "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(0,0,0,0.45) 100%)"
        : "rgba(0,0,0,0.3)",
      border: `1px solid ${isNew ? "rgba(37,99,235,0.4)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: "12px",
      padding: "14px 16px",
      marginBottom: "10px",
      transition: "border 0.4s ease, background 0.4s ease",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#ef4444",
          boxShadow: "0 0 6px #ef4444",
          animation: "pulse 1.5s infinite",
          flexShrink: 0,
        }} />
        <MatchTypeTag type={match.matchType} />
        <span style={{
          color: "#e5e7eb",
          fontWeight: 600,
          fontSize: "0.82rem",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {match.name}
        </span>
      </div>

      {/* Innings scores */}
      {match.innings && match.innings.length > 0 ? (
        <div style={{ marginBottom: "8px" }}>
          {match.innings.map((inn, i) => (
            <InningsRow key={i} inn={inn} />
          ))}
        </div>
      ) : (
        <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginBottom: "8px" }}>
          Score not available yet
        </div>
      )}

      {/* Status */}
      {match.status && (
        <div style={{
          color: "#fbbf24",
          fontSize: "0.72rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "7px",
          marginTop: "4px",
        }}>
          📍 {match.status}
        </div>
      )}

      {/* Venue */}
      {match.venue && (
        <div style={{ color: "#6b7280", fontSize: "0.68rem", marginTop: "3px" }}>
          🏟️ {match.venue}
        </div>
      )}
    </div>
  );
}

// ─── Setup screen shown when no API key is set ────────────────────────────────
function NoKeyScreen() {
  return (
    <div style={{
      textAlign: "center",
      padding: "30px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "14px",
    }}>
      <div style={{ fontSize: "2.5rem" }}>🔑</div>
      <h3 style={{ margin: 0, color: "#f9fafb", fontSize: "1rem" }}>
        Connect to Real Live Matches
      </h3>
      <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: 0, lineHeight: 1.6, maxWidth: "300px" }}>
        Get a <strong style={{ color: "#f9fafb" }}>free API key</strong> from{" "}
        <a href="https://www.cricketdata.org/" target="_blank" rel="noreferrer"
           style={{ color: "#60a5fa" }}>cricketdata.org</a>{" "}
        and add it to your server:
      </p>

      <div style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "12px 16px",
        width: "100%",
        textAlign: "left",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        color: "#34d399",
      }}>
        <div style={{ color: "#6b7280", marginBottom: "4px" }}># server/.env</div>
        <div>CRICAPI_KEY=<span style={{ color: "#fbbf24" }}>your_key_here</span></div>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "100%",
        fontSize: "0.72rem",
        color: "#9ca3af",
      }}>
        <div>✅ 100 free requests/day</div>
        <div>✅ International + IPL + domestic matches</div>
        <div>✅ T20 / ODI / Test live scores</div>
        <div>✅ No credit card required</div>
      </div>

      <a
        href="https://www.cricketdata.org/"
        target="_blank"
        rel="noreferrer"
        style={{
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          color: "#fff",
          padding: "10px 22px",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.82rem",
          letterSpacing: "0.03em",
        }}
      >
        Get Free API Key →
      </a>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function LiveScorePanel() {
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
      setNeedsKey(true);
    });

    es.addEventListener("live_matches", (e) => {
      const d = JSON.parse(e.data);
      const incoming = d.matches || [];

      // Detect truly new matches (not seen before)
      const newIds = new Set(
        incoming
          .filter((m) => !prevMatchIds.current.has(m.id))
          .map((m) => m.id)
      );
      prevMatchIds.current = new Set(incoming.map((m) => m.id));

      setMatches(incoming);
      setNewMatchIds(newIds);
      setLastUpdated(new Date());
      setError(null);

      // Clear "new" highlights after 3s
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

  return (
    <div style={{
      background: "rgba(0,0,0,0.5)",
      borderRadius: "16px",
      padding: "20px",
      border: "1px solid rgba(255,255,255,0.08)",
      height: "100%",
    }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <div style={{
          width: "9px", height: "9px", borderRadius: "50%",
          background: connected ? "#10b981" : "#ef4444",
          boxShadow: connected ? "0 0 8px #10b981" : "0 0 8px #ef4444",
          animation: "pulse 2s infinite",
          flexShrink: 0,
        }} />
        <h3 style={{ margin: 0, color: "#f9fafb", fontSize: "0.95rem", fontWeight: 700 }}>
          🌐 Live Cricket Matches
        </h3>
        {lastUpdated && (
          <span style={{ marginLeft: "auto", color: "#6b7280", fontSize: "0.65rem" }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* ── No key state ───────────────────────────────────────────── */}
      {needsKey && <NoKeyScreen />}

      {/* ── Error state ────────────────────────────────────────────── */}
      {!needsKey && error && (
        <div style={{
          background: "rgba(220,38,38,0.1)",
          border: "1px solid rgba(220,38,38,0.3)",
          borderRadius: "8px",
          padding: "12px",
          color: "#fca5a5",
          fontSize: "0.78rem",
          textAlign: "center",
          marginBottom: "12px",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Connecting state ───────────────────────────────────────── */}
      {!needsKey && !error && !connected && matches.length === 0 && (
        <div style={{ color: "#6b7280", textAlign: "center", padding: "30px 0", fontSize: "0.85rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📡</div>
          Connecting to live feed...
        </div>
      )}

      {/* ── No matches ─────────────────────────────────────────────── */}
      {!needsKey && connected && matches.length === 0 && !error && (
        <div style={{ color: "#6b7280", textAlign: "center", padding: "30px 0", fontSize: "0.85rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🏏</div>
          No live matches right now.
          <div style={{ fontSize: "0.72rem", marginTop: "6px" }}>Check back during an active match.</div>
        </div>
      )}

      {/* ── Match cards ────────────────────────────────────────────── */}
      {!needsKey && matches.length > 0 && (
        <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "4px" }}>
          <div style={{ color: "#6b7280", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
            {matches.length} match{matches.length !== 1 ? "es" : ""} live
          </div>
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} isNew={newMatchIds.has(m.id)} />
          ))}
        </div>
      )}

      {/* ── Real data badge ───────────────────────────────────────── */}
      {!needsKey && connected && (
        <div style={{
          marginTop: "12px",
          textAlign: "center",
          fontSize: "0.65rem",
          color: "#374151",
        }}>
          Powered by cricketdata.org · Updates every 30s
        </div>
      )}
    </div>
  );
}
