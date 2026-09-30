const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { uploadAvatar } = require("../middleware/upload");

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

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ message: "Email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    return res.status(201).json({ message: "Registration successful", userId: user._id });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password").populate("followers following", "username");
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch profile", error: error.message });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { username, bio, profilePicture } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();
    return res.json({ message: "Profile updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Update failed", error: error.message });
  }
});

/** Upload profile photo (multipart field name: avatar). */
router.post("/me/avatar", authMiddleware, (req, res, next) => {
  uploadAvatar.single("avatar")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload failed" });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file received (use field name: avatar)" });
    const url = `/public/uploads/${req.file.filename}`;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.profilePicture = url;
    await user.save();
    return res.json({ message: "Profile photo updated", profilePicture: url, user });
  } catch (error) {
    return res.status(500).json({ message: "Avatar upload failed", error: error.message });
  }
});

router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select("username email bio profilePicture");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch users", error: error.message });
  }
});

router.post("/follow/:targetUserId", authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    if (targetUserId === req.userId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const user = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);
    if (!user || !targetUser) return res.status(404).json({ message: "User not found" });

    if (!user.following.includes(targetUserId)) user.following.push(targetUserId);
    if (!targetUser.followers.includes(req.userId)) targetUser.followers.push(req.userId);

    await user.save();
    await targetUser.save();

    return res.json({ message: "Followed user successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Follow failed", error: error.message });
  }
});

router.post("/unfollow/:targetUserId", authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const user = await User.findById(req.userId);
    const targetUser = await User.findById(targetUserId);
    if (!user || !targetUser) return res.status(404).json({ message: "User not found" });

    user.following = user.following.filter((id) => id.toString() !== targetUserId);
    targetUser.followers = targetUser.followers.filter((id) => id.toString() !== req.userId);

    await user.save();
    await targetUser.save();

    return res.json({ message: "Unfollowed user successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unfollow failed", error: error.message });
  }
});

module.exports = router;
