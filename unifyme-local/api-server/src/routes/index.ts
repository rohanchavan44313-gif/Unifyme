import { Router } from "express";

import authRouter from "./auth.js";
import usersRouter from "./users.js";
import postsRouter from "./posts.js";
import messagesRouter from "./messages.js";
import healthRouter from "./health.js";


const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(postsRouter);
router.use(messagesRouter);

export default router;