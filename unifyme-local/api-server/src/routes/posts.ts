import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Post } from "../models/Post.js";
import { Like } from "../models/Like.js";
import { Comment } from "../models/Comment.js";
import { User } from "../models/User.js";

const router = Router();

const CreatePostBody = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(2200).optional(),
});

const CreateCommentBody = z.object({
  content: z.string().min(1).max(2200),
});

async function enrichPost(post: any, currentUserId: string | null) {
  const user = await User.findById(post.userId).lean();
  const [likesCount, commentsCount, isLiked] = await Promise.all([
    Like.countDocuments({ postId: post._id }),
    Comment.countDocuments({ postId: post._id }),
    currentUserId
      ? Like.exists({ postId: post._id, userId: new mongoose.Types.ObjectId(currentUserId) })
      : Promise.resolve(false),
  ]);
  return {
    id: post._id.toString(),
    userId: post.userId.toString(),
    imageUrl: post.imageUrl,
    caption: post.caption ?? null,
    createdAt: post.createdAt,
    username: user?.username ?? "",
    displayName: user?.displayName ?? null,
    profileImageUrl: user?.profileImageUrl ?? null,
    likesCount,
    commentsCount,
    isLiked: !!isLiked,
  };
}

// GET /api/posts
router.get("/posts", async (req: Request, res: Response) => {
  const currentUserId = req.isAuthenticated() ? req.user.id : null;
  const posts = await Post.find().sort({ createdAt: -1 }).lean();
  const result = await Promise.all(posts.map((p) => enrichPost(p, currentUserId)));
  res.json(result);
});

// GET /api/posts/:id
router.get("/posts/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  const currentUserId = req.isAuthenticated() ? req.user.id : null;
  const post = await Post.findById(id).lean();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(await enrichPost(post, currentUserId));
});

// POST /api/posts
router.post("/posts", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const post = await Post.create({
    userId: req.user.id,
    imageUrl: parsed.data.imageUrl,
    caption: parsed.data.caption,
  });
  res.status(201).json(await enrichPost(post, req.user.id));
});

// DELETE /api/posts/:id
router.delete("/posts/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  const post = await Post.findById(id).lean();
  if (!post || post.userId.toString() !== req.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await Post.findByIdAndDelete(id);
  res.json({ success: true });
});

// POST /api/posts/:id/like (and /likes alias)
router.post("/posts/:id/likes", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = req.params.id;
  if (!mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  await Like.findOneAndUpdate(
    { postId, userId: req.user.id },
    { postId, userId: req.user.id },
    { upsert: true }
  );
  res.json({ success: true });
});

// POST /api/posts/:id/like
router.post("/posts/:id/like", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = req.params.id;
  if (!mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  await Like.findOneAndUpdate(
    { postId, userId: req.user.id },
    { postId, userId: req.user.id },
    { upsert: true }
  );
  res.json({ success: true });
});

// DELETE /api/posts/:id/like (and /likes alias)
router.delete("/posts/:id/likes", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = req.params.id;
  if (!mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  await Like.deleteOne({ postId, userId: req.user.id });
  res.json({ success: true });
});

router.delete("/posts/:id/like", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = req.params.id;
  if (!mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  await Like.deleteOne({ postId, userId: req.user.id });
  res.json({ success: true });
});

// GET /api/posts/:id/comments
router.get("/posts/:id/comments", async (req: Request, res: Response) => {
  const postId = req.params.id;
  if (!mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  const comments = await Comment.find({ postId }).sort({ createdAt: 1 }).lean();
  const result = await Promise.all(
    comments.map(async (c) => {
      const user = await User.findById(c.userId).lean();
      return {
        id: c._id.toString(),
        postId: c.postId.toString(),
        userId: c.userId.toString(),
        content: c.content,
        createdAt: c.createdAt,
        username: user?.username ?? "",
        displayName: user?.displayName ?? null,
        profileImageUrl: user?.profileImageUrl ?? null,
      };
    })
  );
  res.json(result);
});

// POST /api/posts/:id/comments
router.post("/posts/:id/comments", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = req.params.id;
  if (!mongoose.isValidObjectId(postId)) {
    res.status(400).json({ error: "Invalid post ID" });
    return;
  }
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const comment = await Comment.create({
    postId,
    userId: req.user.id,
    content: parsed.data.content,
  });
  const user = await User.findById(req.user.id).lean();
  res.status(201).json({
    id: comment._id.toString(),
    postId: comment.postId.toString(),
    userId: comment.userId.toString(),
    content: comment.content,
    createdAt: comment.createdAt,
    username: user?.username ?? "",
    displayName: user?.displayName ?? null,
    profileImageUrl: user?.profileImageUrl ?? null,
  });
});

export default router;
