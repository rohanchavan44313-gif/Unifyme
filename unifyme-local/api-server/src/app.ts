import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authMiddleware } from "./middlewares/authMiddleware.js";
import router from "./routes/index.js";

const app = express();

// ✅ FRONTEND URL (Netlify)
const CLIENT_URL = "https://jocular-taffy-53bc4e.netlify.app";

// ✅ CORS (VERY IMPORTANT)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ✅ Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ROOT TEST ROUTE
app.get("/", (_req, res) => {
  res.send("API is running 🚀");
});

// ✅ Auth middleware
app.use(authMiddleware);

// ✅ API routes
app.use("/api", router);

export default app;