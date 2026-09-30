const express = require("express");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const User = require("../models/User");

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

router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) {
      return res.status(400).json({ message: "receiverId and text are required" });
    }
    if (receiverId === req.userId) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      text
    });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ message: "Could not send message", error: error.message });
  }
});

router.get("/conversation/:otherUserId", authMiddleware, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId }
      ]
    })
      .populate("sender receiver", "username")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch conversation", error: error.message });
  }
});

router.get("/inbox", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.userId }, { receiver: req.userId }]
    })
      .populate("sender receiver", "username")
      .sort({ createdAt: -1 });

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Could not fetch inbox", error: error.message });
  }
});

module.exports = router;
