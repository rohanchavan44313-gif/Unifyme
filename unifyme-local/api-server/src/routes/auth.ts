import { Router, type Request, type Response } from "express";

const router = Router();

// ✅ REGISTER
router.post("/register", (req: Request, res: Response) => {
  res.json({ message: "register works" });
});

// ✅ LOGIN
router.post("/login", (req: Request, res: Response) => {
  res.json({ message: "login works" });
});

// ✅ USER
router.get("/user", (_req: Request, res: Response) => {
  res.json({ user: null });
});

// ✅ LOGOUT
router.get("/logout", (_req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;