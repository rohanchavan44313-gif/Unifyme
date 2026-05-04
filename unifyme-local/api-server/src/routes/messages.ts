import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";

const router = Router();

const SendMessageBody = z.object({
  content: z.string().min(1).max(2000),
});

// GET /api/messages/conversations
router.get("/messages/conversations", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = new mongoose.Types.ObjectId(req.user.id);

  // Aggregate latest message per conversation partner
  const conversations = await Message.aggregate([
    {
      $match: { $or: [{ fromUserId: userId }, { toUserId: userId }] },
    },
    {
      $addFields: {
        partnerId: {
          $cond: [{ $eq: ["$fromUserId", userId] }, "$toUserId", "$fromUserId"],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$partnerId",
        lastMessage: { $first: "$content" },
        lastMessageAt: { $first: "$createdAt" },
      },
    },
    { $sort: { lastMessageAt: -1 } },
  ]);

  const result = await Promise.all(
    conversations.map(async (c) => {
      const partner = await User.findById(c._id).lean();
      return {
        userId: c._id.toString(),
        username: partner?.username ?? `user_${c._id.toString().slice(0, 8)}`,
        displayName: partner?.displayName ?? null,
        profileImageUrl: partner?.profileImageUrl ?? null,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount: 0,
      };
    })
  );

  res.json(result);
});

// GET /api/messages/:username
router.get("/messages/:username", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const target = await User.findOne({ username: req.params.username }).lean();
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userId = new mongoose.Types.ObjectId(req.user.id);
  const targetId = target._id;

  const messages = await Message.find({
    $or: [
      { fromUserId: userId, toUserId: targetId },
      { fromUserId: targetId, toUserId: userId },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  const currentUser = await User.findById(req.user.id).lean();

  res.json(
    messages.map((m) => ({
      id: m._id.toString(),
      fromUserId: m.fromUserId.toString(),
      toUserId: m.toUserId.toString(),
      fromUsername:
        m.fromUserId.toString() === req.user.id
          ? currentUser?.username ?? ""
          : target.username,
      content: m.content,
      createdAt: m.createdAt,
    }))
  );
});

// POST /api/messages/:username
router.post("/messages/:username", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const target = await User.findOne({ username: req.params.username }).lean();
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const sender = await User.findById(req.user.id).lean();
  const msg = await Message.create({
    fromUserId: req.user.id,
    toUserId: target._id,
    content: parsed.data.content,
  });
  res.status(201).json({
    id: msg._id.toString(),
    fromUserId: msg.fromUserId.toString(),
    toUserId: msg.toUserId.toString(),
    fromUsername: sender?.username ?? "",
    content: msg.content,
    createdAt: msg.createdAt,
  });
});

export default router;
