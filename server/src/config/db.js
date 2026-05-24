import mongoose from "mongoose";

let memoryMode = false;

export function isMemoryMode() {
  return memoryMode;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cricai";

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log("MongoDB connected:", uri.replace(/\/\/.*@/, "//***@"));
    memoryMode = false;
    return true;
  } catch (err) {
    memoryMode = true;
    console.warn("MongoDB unavailable — using in-memory store:", err.message);
    return false;
  }
}
