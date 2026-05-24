# CricAI Pro — MERN Stack

Real-time IPL-style **Hinglish commentary arena** built with MongoDB, Express, React (Vite), and Node.js.

## Features

- **Ball-by-ball Hinglish commentary** (filmy / sarcastic / aggressive tones)
- **MongoDB persistence** for match state, feed history, wagon wheel shots
- **REST API** — every ball logged via `POST /api/matches/:id/balls`
- **AI Copilot chat** — NLP intents (six, wicket, Dhoni six, dhol, stats)
- **Live match mode** — demo timeline + ESPN Cricinfo RSS (server-side proxy)
- **AI neural voice commentary** — Hinglish + 20 languages (Hindi, Tamil, Telugu, Bengali, English, Arabic, Spanish, etc.) via Microsoft Edge TTS
- **Web Audio stadium SFX** (client-side, zero audio files)
- **2D pitch animations** + wagon wheel shot map

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. (Optional) MongoDB

Copy env file and start MongoDB locally, or use [MongoDB Atlas](https://www.mongodb.com/atlas):

```bash
copy server\.env.example server\.env
```

If MongoDB is unavailable, the server **automatically falls back to in-memory storage** so you can still demo everything.

### 3. Run dev (API + React)

```bash
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:5000/api/health  

### 4. Production build

```bash
npm run build
npm start
```

Serves the built React app from Express on port 5000.

## Project Structure

```
cricAi/
├── client/          # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       ├── api/client.js
│       └── utils/audio.js
├── server/          # Express + MongoDB API
│   └── src/
│       ├── routes/      # matches, chat, live
│       ├── services/    # commentary, NLP, match logic
│       └── models/      # Mongoose Match schema
├── app.js           # Legacy single-file CDN version (deprecated)
└── package.json     # Root scripts (concurrently)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server + DB mode |
| POST | `/api/matches` | Create match |
| GET | `/api/matches/:id` | Get match + win probability |
| PATCH | `/api/matches/:id/setup` | Update players / scenario |
| POST | `/api/matches/:id/balls` | Bowl a ball |
| POST | `/api/matches/:id/reset` | Reset scoreboard |
| POST | `/api/chat/:matchId` | Copilot NLP chat |
| GET | `/api/live/matches` | Live Cricinfo RSS list |
| GET | `/api/live/demo-timeline` | Demo live feed |
| GET | `/api/tts/languages` | List voice languages |
| POST | `/api/tts/speak` | Neural AI speech (returns MP3) |

## Tech Stack

- **MongoDB** + Mongoose — match & ball feed persistence  
- **Express** — REST API, CORS, live RSS proxy  
- **React 18** + **Vite** — fast HMR frontend  
- **Node.js** — ES modules  

## Legacy Version

The original zero-build CDN version (`index.html` + `app.js`) still works by opening `index.html` in a browser, but **use the MERN stack** for persistence, API ledger, and production deployment.
