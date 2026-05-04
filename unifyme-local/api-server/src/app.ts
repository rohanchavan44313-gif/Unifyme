import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authMiddleware } from "./middlewares/authMiddleware.js";
import router from "./routes/index.js";

const app = express();

// ✅ frontend URL (Netlify)
const CLIENT_URL =
  process.env.CLIENT_URL || "https://jocular-taffy-53bc4e.netlify.app";

// ✅ CORS (ONLY once)
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

// ✅ test route (ROOT)
app.get("/", (_req, res) => {
  res.send("API is running 🚀");
});

// ✅ auth middleware
app.use(authMiddleware);

// ✅ API routes
app.use("/api", router);

export default app;