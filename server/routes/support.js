const express = require("express");
const Message = require("../models/Message");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

const CATEGORIES = ["account", "listing", "booking", "payment", "other"];

// POST /api/support  (any logged-in user contacts the admin)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { category, subject, message } = req.body;
    if (!subject || !String(subject).trim() || !message || !String(message).trim()) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const doc = await Message.create({
      userId: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.userType,
      category: CATEGORIES.includes(category) ? category : "other",
      subject: String(subject).trim().slice(0, 120),
      message: String(message).trim().slice(0, 2000),
    });

    // Optional heads-up email to the admin (best effort — never blocks the request).
    if (process.env.ADMIN_NOTIFY_EMAIL) {
      sendMail({
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `[House Rent support] ${doc.subject}`,
        text: `From: ${doc.name} <${doc.email}> (${doc.role})\nCategory: ${doc.category}\n\n${doc.message}`,
      }).catch((e) => console.error("support notify failed:", e.message));
    }

    res.status(201).json({ message: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send your message" });
  }
});

// GET /api/support/mine  (the user's own requests + admin replies)
router.get("/mine", requireAuth, async (req, res) => {
  const messages = await Message.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ messages });
});

// GET /api/support  (admin: all requests, optional ?status=open|resolved)
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status === "open" || status === "resolved") query.status = status;
  const messages = await Message.find(query).sort({ createdAt: -1 });
  const openCount = await Message.countDocuments({ status: "open" });
  res.json({ messages, openCount });
});

// PATCH /api/support/:id/reply  (admin replies; optionally resolves)
router.patch("/:id/reply", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { reply, resolve } = req.body;
    if (!reply || !String(reply).trim()) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }
    const doc = await Message.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Message not found" });

    doc.adminReply = String(reply).trim().slice(0, 2000);
    doc.repliedBy = req.user.name;
    doc.repliedAt = new Date();
    if (resolve !== false) doc.status = "resolved";
    await doc.save();

    sendMail({
      to: doc.email,
      subject: `Re: ${doc.subject} — House Rent support`,
      text: `Hi ${doc.name},\n\n${doc.adminReply}\n\n— House Rent Admin\n\nYou can also see this reply under Contact Admin on the site.`,
    }).catch((e) => console.error("reply email failed:", e.message));

    res.json({ message: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send reply" });
  }
});

// PATCH /api/support/:id/status  (admin reopens/resolves without replying)
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["open", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const doc = await Message.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!doc) return res.status(404).json({ message: "Message not found" });
    res.json({ message: doc });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

module.exports = router;
