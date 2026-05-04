import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGODB_URI!);

    console.log("✅ Connected to MongoDB");

    // 🔥 TEMP FIX (run only once)
    try {
      await mongoose.connection.db!.collection("users").drop();
      console.log("✅ users collection RESET (old email index removed)");
    } catch (err) {
      console.log("No collection to drop");
    }

    isConnected = true;

  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

export default mongoose;