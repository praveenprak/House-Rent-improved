const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/users (admin only)
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });
  res.json({ users });
});

// PATCH /api/users/:id/grant (admin grants/ungrants an owner)
router.patch("/:id/grant", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.userType !== "owner") {
      return res.status(400).json({ message: "Only owners can be granted" });
    }
    user.granted = !user.granted;
    await user.save();
    res.json({ user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: "Failed to update grant status" });
  }
});

// DELETE /api/users/:id (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
