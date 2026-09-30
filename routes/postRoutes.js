const express = require("express");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const User = require("../models/User");
const { uploadPostFields } = require("../middleware/upload");

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

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { content, imageUrl, videoUrl, isReel } = req.body;
    const reel = isReel === true || isReel === "true";

    if (reel) {
      if (!videoUrl) {
        return res.status(400).json({ message: "Reel must include a videoUrl" });
      }

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const post = await Post.create({
        user: req.userId,
        content: content || "",
        imageUrl: imageUrl || "",
        isReel: true,
        videoUrl: videoUrl || ""
      });

      return res.status(201).json(post);
    }

    if (!content && !imageUrl) {
      return res.status(400).json({ message: "Post must have text or image URL" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const post = await Post.create({
      user: req.userId,
      content: content || "",
      imageUrl: imageUrl || "",
      isReel: false,
      videoUrl: ""
    });

    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ message: "Could not create post", error: error.message });
  }
});

/**
 * Create post or reel with file upload(s).
 * multipart fields: content (text), isReel ("true"/"false"), image (file), video (file)
 */
router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    uploadPostFields.fields([
      { name: "image", maxCount: 1 },
      { name: "video", maxCount: 1 }
    ])(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || "Upload failed" });
      next();
    });
  },
  async (req, res) => {
    try {
      const content = (req.body && req.body.content) || "";
      const isReel = req.body && (req.body.isReel === "true" || req.body.isReel === true);

      let imageUrl = "";
      let videoUrl = "";

      if (req.files && req.files.image && req.files.image[0]) {
        imageUrl = `/public/uploads/${req.files.image[0].filename}`;
      }

      if (req.files && req.files.video && req.files.video[0]) {
        videoUrl = `/public/uploads/${req.files.video[0].filename}`;
      }

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (isReel) {
        if (!videoUrl) {
          return res.status(400).json({ message: "Reel requires a video file" });
        }

        const post = await Post.create({
          user: req.userId,
          content,
          imageUrl,
          isReel: true,
          videoUrl
        });

        return res.status(201).json(post);
      }

      const urlFromBody = (req.body && req.body.imageUrl) || "";
      const finalImage = imageUrl || urlFromBody;

      if (!finalImage && !content) {
        return res.status(400).json({ message: "Post needs a photo, text, or image URL" });
      }

      const post = await Post.create({
        user: req.userId,
        content,
        imageUrl: finalImage,
        isReel: false,
        videoUrl: ""
      });

      return res.status(201).json(post);
    } catch (error) {
      return res.status(500).json({ message: "Could not create post", error: error.message });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch posts", error: error.message });
  }
});

router.get("/reels", async (req, res) => {
  try {
    const reels = await Post.find({ isReel: true })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.json(reels);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch reels", error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch user posts", error: error.message });
  }
});

router.put("/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.userId) return res.status(403).json({ message: "Forbidden" });

    const { content, imageUrl, videoUrl, isReel } = req.body;
    if (content !== undefined) post.content = content;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;
    if (videoUrl !== undefined) post.videoUrl = videoUrl;
    if (isReel !== undefined) post.isReel = isReel === true || isReel === "true";

    await post.save();

    return res.json({ message: "Post updated", post });
  } catch (error) {
    return res.status(500).json({ message: "Could not update post", error: error.message });
  }
});

router.delete("/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.user.toString() !== req.userId) return res.status(403).json({ message: "Forbidden" });

    await post.deleteOne();
    return res.json({ message: "Post deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete post", error: error.message });
  }
});

router.post("/:postId/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.dislikes = post.dislikes.filter((id) => id.toString() !== req.userId);

    if (post.likes.some((id) => id.toString() === req.userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    return res.json({
      message: "Like updated",
      likes: post.likes.length,
      dislikes: post.dislikes.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not like post", error: error.message });
  }
});

router.post("/:postId/dislike", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.likes = post.likes.filter((id) => id.toString() !== req.userId);

    if (post.dislikes.some((id) => id.toString() === req.userId)) {
      post.dislikes = post.dislikes.filter((id) => id.toString() !== req.userId);
    } else {
      post.dislikes.push(req.userId);
    }

    await post.save();

    return res.json({
      message: "Dislike updated",
      likes: post.likes.length,
      dislikes: post.dislikes.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not dislike post", error: error.message });
  }
});

module.exports = router;
