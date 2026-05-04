import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { User } from "../models/User.js";
import { Follow } from "../models/Follow.js";
import { Post } from "../models/Post.js";

const router = Router();

const UpdateProfileBody = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(300).optional(),
  profileImageUrl: z.string().url().optional(),
});

async function getUserStats(userId: string, currentUserId: string | null) {
  const id = new mongoose.Types.ObjectId(userId);
  const [followersCount, followingCount, postsCount] = await Promise.all([
    Follow.countDocuments({ followingId: id }),
    Follow.countDocuments({ followerId: id }),
    Post.countDocuments({ userId: id }),
  ]);

  const isFollowing = currentUserId
    ? !!(await Follow.findOne({
        followerId: new mongoose.Types.ObjectId(currentUserId),
        followingId: id,
      }).lean())
    : false;

  return { followersCount, followingCount, postsCount, isFollowing };
}

// GET /api/users?q=search
router.get("/users", async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  const currentUserId = req.isAuthenticated() ? req.user.id : null;

  const filter = q ? { username: { $regex: q, $options: "i" } } : {};
  const users = await User.find(filter).limit(20).lean();

  const result = await Promise.all(
    users.map(async (u) => {
      const stats = await getUserStats(u._id.toString(), currentUserId);
      return {
        id: u._id.toString(),
        username: u.username,
        displayName: u.displayName ?? null,
        bio: u.bio ?? null,
        profileImageUrl: u.profileImageUrl ?? null,
        ...stats,
      };
    })
  );

  res.json(result);
});

// GET /api/users/:username
router.get("/users/:username", async (req: Request, res: Response) => {
  const currentUserId = req.isAuthenticated() ? req.user.id : null;
  const user = await User.findOne({ username: req.params.username }).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const stats = await getUserStats(user._id.toString(), currentUserId);
  res.json({
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    ...stats,
  });
});

// GET /api/users/:username/posts
router.get("/users/:username/posts", async (req: Request, res: Response) => {
  const currentUserId = req.isAuthenticated() ? req.user.id : null;
  const user = await User.findOne({ username: req.params.username }).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { Like } = await import("../models/Like.js");
  const { Comment } = await import("../models/Comment.js");

  const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 }).lean();

  const result = await Promise.all(
    posts.map(async (p) => {
      const postId = p._id;
      const [likesCount, commentsCount, isLiked] = await Promise.all([
        Like.countDocuments({ postId }),
        Comment.countDocuments({ postId }),
        currentUserId
          ? Like.exists({ postId, userId: new mongoose.Types.ObjectId(currentUserId) })
          : Promise.resolve(false),
      ]);
      return {
        id: p._id.toString(),
        userId: p.userId.toString(),
        imageUrl: p.imageUrl,
        caption: p.caption ?? null,
        createdAt: p.createdAt,
        username: user.username,
        displayName: user.displayName ?? null,
        profileImageUrl: user.profileImageUrl ?? null,
        likesCount,
        commentsCount,
        isLiked: !!isLiked,
      };
    })
  );

  res.json(result);
});

// POST /api/users/:username/follow
router.post("/users/:username/follow", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const target = await User.findOne({ username: req.params.username }).lean();
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await Follow.findOneAndUpdate(
    { followerId: req.user.id, followingId: target._id },
    { followerId: req.user.id, followingId: target._id },
    { upsert: true }
  );
  res.json({ success: true });
});

// DELETE /api/users/:username/follow
router.delete("/users/:username/follow", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const target = await User.findOne({ username: req.params.username }).lean();
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await Follow.deleteOne({ followerId: req.user.id, followingId: target._id });
  res.json({ success: true });
});

// PATCH /api/profile
router.patch("/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.profileImageUrl !== undefined) updates.profileImageUrl = parsed.data.profileImageUrl;

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).lean();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const stats = await getUserStats(user._id.toString(), req.user.id);
  res.json({
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    ...stats,
  });
});

export default router;


// GET followers
router.get("/users/:username/followers", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const follows = await Follow.find({ followingId: user._id }).lean();

  const users = await User.find({
    _id: { $in: follows.map(f => f.followerId) }
  }).select("username");

  res.json(users);
});

// GET following
router.get("/users/:username/following", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const follows = await Follow.find({ followerId: user._id }).lean();

  const users = await User.find({
    _id: { $in: follows.map(f => f.followingId) }
  }).select("username");

  res.json(users);
});
