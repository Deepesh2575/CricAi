const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),
  inningsStatus: () => request("/api/innings/status"),
  createMatch: (scenario = "death") =>
    request("/api/matches", {
      method: "POST",
      body: JSON.stringify({ scenario }),
    }),
  getMatch: (id) => request(`/api/matches/${id}`),
  updateSetup: (id, body) =>
    request(`/api/matches/${id}/setup`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  resetMatch: (id, scenario) =>
    request(`/api/matches/${id}/reset`, {
      method: "POST",
      body: JSON.stringify({ scenario }),
    }),
  bowlBall: (id, body) =>
    request(`/api/matches/${id}/balls`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  liveBall: (id, body) =>
    request(`/api/matches/${id}/live-ball`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  chat: (matchId, message) =>
    request(`/api/chat/${matchId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  liveMatches: () => request("/api/live/matches"),
  demoTimeline: () => request("/api/live/demo-timeline"),
  /** Opens a real-time SSE connection for live ball-by-ball updates */
  connectLiveStream: () => {
    const base = import.meta.env.VITE_API_URL || "";
    return new EventSource(`${base}/api/live/stream`);
  },
  ttsLanguages: () => request("/api/tts/languages"),
  ttsSpeak: async (text, languageId, outcome) => {
    const API_BASE = import.meta.env.VITE_API_URL || "";
    const res = await fetch(`${API_BASE}/api/tts/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, languageId, outcome }),
    });
    if (!res.ok) throw new Error("TTS request failed");
    return res.blob();
  },
};
