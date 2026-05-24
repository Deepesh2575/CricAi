import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB, isMemoryMode } from "./config/db.js";
import matchesRouter from "./routes/matches.js";
import chatRouter from "./routes/chat.js";
import liveRouter from "./routes/live.js";
import ttsRouter from "./routes/tts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "CricAI API",
    dbMode: isMemoryMode() ? "memory" : "mongodb",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/innings/status", (_req, res) => {
  res.json({
    status: 200,
    dbConnected: !isMemoryMode(),
    cluster: isMemoryMode() ? "In-Memory Fallback" : "MongoDB",
    latency: `${Math.floor(Math.random() * 20 + 8)}ms`,
  });
});

app.use("/api/matches", matchesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/live", liveRouter);
app.use("/api/tts", ttsRouter);

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || "Server error" });
});

await connectDB();

const server = app.listen(PORT, () => {
  console.log(`CricAI server running on http://localhost:${PORT}`);
  console.log(`Database mode: ${isMemoryMode() ? "in-memory" : "mongodb"}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use. Another CricAI/dev server is probably still running.\n` +
        `  • Stop it:  netstat -ano | findstr :${PORT}   then   taskkill /PID <pid> /F\n` +
        `  • Or use another port: set PORT=5001 && npm start\n`
    );
    process.exit(1);
  }
  throw err;
});
