# 🏏 CricAI Pro — MERN Stack Live Cricket Commentary Platform

<div align="center">

**Real-time IPL-style AI commentary arena with neural voice synthesis, live Cricinfo data, and a Gemini-powered AI copilot.**

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

## ✨ Features

### 🎙️ AI Neural Voice Commentary
- **20+ languages** — Hindi, Hinglish, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Punjabi, Gujarati, Urdu, English (IN/US/UK), Arabic, Spanish, French, German, Portuguese, Japanese, Chinese
- **Microsoft Edge TTS neural voices** served as MP3 audio from the Express API
- **Auto-translation** — live Cricinfo English commentary auto-translated to the chosen language before synthesis
- **Browser Speech API fallback** — works offline if Edge TTS is unreachable
- **Outcome-aware pitch & rate** — SIX/WICKET = excited pitch, DOT = calm delivery

### 📡 Live Cricket Data
- **ESPNcricinfo scraper** — fetches real-time live matches, team names, scores, wickets, overs directly from the live scores page with `__NEXT_DATA__` JSON extraction
- **Rich structured data** — Current Run Rate (CRR), Required Run Rate (RRR), overs progress, innings breakdown, match type (T20/ODI/Test), batting team detection
- **Ball-by-ball Cricinfo commentary** — fetches real commentary text from individual match pages and feeds it through the TTS pipeline
- **CricAPI integration** — plug in a free API key for even richer SSE-streamed ball-by-ball data
- **RSS fallback** — automatically falls back to `espncricinfo.com/rss/livescores.xml` if the main scraper fails
- **SSE real-time stream** — `GET /api/live/stream` streams live match events to all connected clients

### 🤖 Gemini AI Copilot
- **Gemini 2.0 Flash** with **Google Search grounding** for real-world live scores
- **Tool-calling agentic loop** — bowls balls, sets players, resets match, fetches stats via declared function tools
- **Hinglish personality** — desi IPL commentator energy with Bollywood references
- **Conversation memory** per match — multi-turn chat history
- **Legacy NLP fallback** — keyword-intent matching when no Gemini API key is set

### 🏟️ Match Simulation & Scoring
- **Ball-by-ball simulation** — DOT, RUNS, FOUR, SIX, WICKET, EXTRA outcomes
- **Batting shot types** — cover drive, sweep, pull, straight drive, scoop, helicopter
- **Win probability engine** — scenario-aware calculation (death overs, powerplay, middle overs)
- **Wagon wheel** shot map with real ball placement
- **Crowd meter** — dynamic crowd noise indicator based on outcome
- **2D pitch field animation** — ball trajectory, bat hit spark, bowler/striker animations
- **4 pre-loaded scenarios** — Death Overs, Powerplay, Middle Overs, Last Ball Climax

### 🗄️ MERN Persistence
- **MongoDB** for all match state, ball feed history, wagon wheel shots
- **In-memory fallback** — zero-config demo mode if MongoDB is unavailable
- **Full REST API ledger** — every API call visible in the MERN dev console inside the UI

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (v22 recommended)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or Atlas URI)

### 1. Clone & install all dependencies

```bash
git clone <repo-url>
cd cricAi
npm run install:all
```

### 2. Configure environment

```bash
copy server\.env.example server\.env
```

Edit `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cricai
CLIENT_URL=http://localhost:5173

# Optional — AI copilot + live commentary generation
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — richer ball-by-ball CricAPI data (free tier: 100 req/day)
CRICAPI_KEY=your_cricapi_key_here
```

> **Without `MONGODB_URI`** — the server auto-falls back to in-memory storage, everything still works.  
> **Without `GEMINI_API_KEY`** — the AI copilot uses keyword NLP fallback.  
> **Without `CRICAPI_KEY`** — live data uses the ESPNcricinfo scraper (no key needed).

### 3. Run in development mode

```bash
npm run dev
```

This starts both servers concurrently:

| Service | URL |
|---------|-----|
| 🎨 React frontend | http://localhost:5173 |
| ⚡ Express API | http://localhost:5000/api/health |

### 4. Production build

```bash
npm run build
npm start
```

Vite builds the React app into `client/dist/`, then Express serves it statically on port 5000.

---

## 📁 Project Structure

```
cricAi/
├── client/                        # React 18 + Vite frontend
│   ├── index.html
│   ├── vite.config.js             # Proxy /api → localhost:5000
│   └── src/
│       ├── App.jsx                # Main app — all UI, state, polling logic
│       ├── App.css                # Dark stadium theme
│       ├── LiveScorePanel.jsx     # SSE-powered real-time match cards
│       ├── api/
│       │   └── client.js          # Typed API client + SSE connector
│       └── utils/
│           ├── audio.js           # Web Audio API SFX (bat, cheer, dhol, horn)
│           ├── commentarySpeaker.js  # TTS orchestration (AI + browser fallback)
│           └── voiceLanguages.js  # BCP-47 language codes for 20+ locales
│
├── server/                        # Express API + Node.js backend
│   ├── .env                       # Environment secrets (gitignored)
│   ├── .env.example               # Template
│   └── src/
│       ├── index.js               # Entry — Express setup, routes, DB connect
│       ├── config/
│       │   └── db.js              # MongoDB connect + in-memory fallback
│       ├── models/
│       │   └── Match.js           # Mongoose schema
│       ├── repositories/
│       │   └── matchRepository.js # CRUD abstraction (works with both DB modes)
│       ├── routes/
│       │   ├── matches.js         # /api/matches — CRUD + ball + live-ball
│       │   ├── chat.js            # /api/chat — Gemini AI copilot
│       │   ├── live.js            # /api/live — SSE stream + match list
│       │   └── tts.js             # /api/tts — neural voice synthesis
│       └── services/
│           ├── agentService.js    # Gemini tool-calling loop + Cricinfo commentary
│           ├── agentTools.js      # Tool declarations (bowl_ball, set_player, etc.)
│           ├── agentMemory.js     # Per-match conversation history
│           ├── commentaryEngine.js # Template-based Hinglish commentary generator
│           ├── liveFeed.js        # Cricinfo scraper — teams, scores, RR, innings
│           ├── liveScoreService.js # CricAPI integration + SSE manager
│           ├── matchLogic.js      # Ball outcomes, win probability, wagon wheel
│           ├── nlpAgent.js        # Keyword-intent NLP fallback
│           ├── scenarioDefaults.js # Powerplay/death/middle overs presets
│           ├── ttsService.js      # Edge TTS synthesis with translation
│           └── voiceLanguages.js  # Voice config for 20+ Microsoft neural voices
│
├── app.js                         # Legacy single-file CDN version (deprecated)
├── index.html                     # Legacy HTML entry
├── style.css                      # Legacy styles
└── package.json                   # Root scripts (concurrently dev + build)
```

---

## 🔌 API Reference

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status + DB mode |
| `GET` | `/api/innings/status` | DB connection + latency |

### Match Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/matches` | Create a new match (`{ scenario }`) |
| `GET` | `/api/matches/:id` | Get match state + win probabilities |
| `PATCH` | `/api/matches/:id/setup` | Update players, bowler, scenario, target |
| `POST` | `/api/matches/:id/reset` | Reset scoreboard |
| `POST` | `/api/matches/:id/balls` | Bowl a ball (`{ outcome }` or `{ shotType }`) |
| `POST` | `/api/matches/:id/live-ball` | Process a live ball from Cricinfo data |

### Live Cricket Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/live/stream` | **SSE** — real-time match event stream |
| `GET` | `/api/live/matches` | Snapshot of all live matches (Cricinfo + CricAPI) |
| `GET` | `/api/live/demo-timeline` | Simulated demo ball timeline |
| `POST` | `/api/live/parse-title` | Parse an ESPN score title string |

### AI Copilot

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/:matchId` | Send message to Gemini AI copilot |

### Neural Voice (TTS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tts/languages` | List all 20+ supported voice languages |
| `POST` | `/api/tts/speak` | Synthesize speech → returns `audio/mpeg` MP3 |
| `POST` | `/api/tts/stop` | Cancel current in-progress TTS job |

---

## 🧠 How Live Commentary Works

```
1. Poll /api/live/matches  (every 9 seconds)
         │
         ▼
2. Detect score change  (runs diff, wicket diff, overs diff)
         │
         ▼
3. POST /api/matches/:id/live-ball
         │
         ├─ Fetch Cricinfo match page HTML
         │   └─ Extract __NEXT_DATA__ → recentBallCommentary
         │
         ├─ Send to Gemini (with Google Search grounding)
         │   └─ Generate high-energy Hinglish commentary
         │
         ├─ Fallback → template-based Hinglish commentary engine
         │
         ▼
4. POST /api/tts/speak
         │
         ├─ Auto-translate text → target language (Google Translate API)
         ├─ Microsoft Edge TTS → .mp3 temp file
         └─ Stream MP3 bytes → browser Audio element
```

---

## 🎛️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `5000`) |
| `MONGODB_URI` | No | MongoDB connection string (falls back to in-memory) |
| `CLIENT_URL` | No | CORS allowed origin (default: `http://localhost:5173`) |
| `GEMINI_API_KEY` | No | Google Gemini AI key for copilot + commentary |
| `CRICAPI_KEY` | No | CricAPI key for SSE ball-by-ball stream |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Database** | MongoDB 8 + Mongoose |
| **Backend** | Node.js 22 + Express 4 (ES Modules) |
| **Frontend** | React 18 + Vite 6 |
| **AI** | Google Gemini 2.0 Flash (tool-calling + Google Search) |
| **TTS** | Microsoft Edge TTS via `node-edge-tts` |
| **Live Data** | ESPNcricinfo scraper + CricAPI REST + SSE |
| **Translation** | Google Translate public endpoint |
| **SFX** | Web Audio API (zero audio files) |
| **Dev** | `node --watch` + Vite HMR + `concurrently` |

---

## 🔑 Getting API Keys

### Gemini API Key (Free)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → Create API key
3. Add to `server/.env` as `GEMINI_API_KEY=...`

### CricAPI Key (Free — 100 req/day)
1. Go to [cricketdata.org](https://www.cricketdata.org/)
2. Sign up → copy your API key
3. Add to `server/.env` as `CRICAPI_KEY=...`

> **Note:** Both keys are completely optional. The app works without them using Cricinfo scraping + NLP fallback.

---

## 📜 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run both client (Vite) + server (node --watch) concurrently |
| `npm run build` | Build React app to `client/dist/` |
| `npm start` | Run production Express server |
| `npm run install:all` | Install root + client + server dependencies |

Run from the **root** `cricAi/` directory.

---

## 📝 Legacy Version

`index.html` + `app.js` + `style.css` in the root are the original zero-build single-file CDN prototype. It still works by opening `index.html` in a browser but **does not have** MongoDB persistence, AI voice, live data, or the Gemini copilot. Use the MERN stack version for all features.
