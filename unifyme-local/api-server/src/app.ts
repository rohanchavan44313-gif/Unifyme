import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authMiddleware } from "./middlewares/authMiddleware.js";
import router from "./routes/index.js";

const app = express();

// ✅ frontend URL (Netlify)
const CLIENT_URL =
  process.env.CLIENT_URL || "https://jocular-taffy-53bc4e.netlify.app";

// ✅ SINGLE correct CORS setup
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ✅ middlewares
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ auth
app.use(authMiddleware);

// ✅ routes
app.use("/api", router);

// ✅ optional test route (good for debugging)
app.get("/", (_req, res) => {
  res.send("API is running 🚀");
});

export default app;