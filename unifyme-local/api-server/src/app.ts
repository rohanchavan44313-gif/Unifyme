import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authMiddleware } from "./middlewares/authMiddleware.js";
import router from "./routes/index.js";

const app = express();

// ✅ CORS (ONLY ONE — supports local + production)
const allowedOrigins = [
  "http://localhost:5173",
  "https://jocular-taffy-53bc4e.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ✅ Middlewares
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ Auth middleware
app.use(authMiddleware);

// ✅ Routes
app.use("/api", router);

export default app;