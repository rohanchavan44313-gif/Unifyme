import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import {
  signToken,
  setSessionCookie,
  clearSessionCookie,
} from "../lib/auth.js";

const router = Router();

const RegisterBody = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().max(50).optional(),
});

const LoginBody = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ✅ REGISTER
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0]?.message ?? "Invalid input",
      });
    }

    let { username, password, displayName } = parsed.data;

    username = username.toLowerCase().trim();

    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return res.status(409).json({ error: "Username is already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      displayName: displayName || undefined,
      passwordHash,
    });

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
    });

    setSessionCookie(res, token);

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName ?? null,
        profileImageUrl: user.profileImageUrl ?? null,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ LOGIN
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    let { username, password } = parsed.data;

    username = username.toLowerCase().trim();

    const user = await User.findOne({ username });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
    });

    setSessionCookie(res, token);

    return res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName ?? null,
        profileImageUrl: user.profileImageUrl ?? null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET CURRENT USER
router.get("/auth/user", (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.json({ user: null });
  }
  return res.json({ user: req.user });
});

// ✅ LOGOUT
router.get("/auth/logout", (req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

export default router;