const express = require("express");
const jwt = require("jsonwebtoken");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "gminsta-secret";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

router.post("/:postId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({
      post: req.params.postId,
      user: req.userId,
      text
    });

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(500).json({ message: "Could not add comment", error: error.message });
  }
});

router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "username profilePicture")
      .sort({ createdAt: 1 });
    return res.json(comments);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch comments", error: error.message });
  }
});

router.delete("/item/:commentId", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user.toString() !== req.userId) return res.status(403).json({ message: "Forbidden" });

    await comment.deleteOne();
    return res.json({ message: "Comment deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete comment", error: error.message });
  }
});

module.exports = router;
