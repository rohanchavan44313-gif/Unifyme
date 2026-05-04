import { Router } from "express";
import jwt from "jsonwebtoken";
import type { Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// ✅ Create token
export function signToken(payload: { userId: string; username: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// ✅ SET COOKIE (FIXES YOUR ISSUE)
export function setSessionCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,       // 🔥 required for production
    sameSite: "none",   // 🔥 required for Netlify ↔ Render
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

// ✅ CLEAR COOKIE
export function clearSessionCookie(res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
}

const router = Router();

// ... all your routes ...

export default router;