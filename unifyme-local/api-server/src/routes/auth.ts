import jwt from "jsonwebtoken";
import type { Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// ✅ create token
export function signToken(payload: { userId: string; username: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// ✅ set cookie (FIXED)
export function setSessionCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,              // 🔥 required for HTTPS (Netlify + Render)
    sameSite: "none" as const, // 🔥 must be lowercase + TS fix
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

// ✅ clear cookie
export function clearSessionCookie(res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
  });
}