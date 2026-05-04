import { Router } from "express";

import authRouter from "./auth.js";
import usersRouter from "./users.js";
import postsRouter from "./posts.js";
import messagesRouter from "./messages.js";
import healthRouter from "./health.js";

const router = Router();

// mount properly
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/posts", postsRouter);
router.use("/messages", messagesRouter);
router.use("/health", healthRouter);

export default router;