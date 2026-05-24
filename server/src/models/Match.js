import mongoose from "mongoose";

const wagonWheelShotSchema = new mongoose.Schema(
  {
    outcome: String,
    angle: Number,
    length: Number,
    runs: Number,
  },
  { _id: false }
);

const feedItemSchema = new mongoose.Schema(
  {
    outcome: String,
    text: String,
    ballNo: String,
    batsman: String,
    bowler: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    scenario: {
      type: String,
      enum: ["powerplay", "middle", "death", "lastball"],
      default: "death",
    },
    score: { type: Number, default: 144 },
    wickets: { type: Number, default: 4 },
    overs: { type: Number, default: 19.0 },
    ballsInOver: { type: Number, default: 0 },
    target: { type: Number, default: 163 },
    striker: { type: String, default: "Virat Kohli" },
    strikerStyle: { type: String, default: "Anchor" },
    bowler: { type: String, default: "Jasprit Bumrah" },
    commentaryStyle: { type: String, default: "filmy" },
    status: {
      type: String,
      enum: ["active", "won", "lost", "allout"],
      default: "active",
    },
    feedHistory: [feedItemSchema],
    feedCount: { type: Number, default: 0 },
    wagonWheel: [wagonWheelShotSchema],
    latestCommentary: {
      type: String,
      default:
        "Namaste cricket fans! CricAI MERN stack live hai — pehli ball bowl karo! 🏏✨",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Match || mongoose.model("Match", matchSchema);
