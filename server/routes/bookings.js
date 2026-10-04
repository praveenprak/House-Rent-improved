const express = require("express");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/bookings (renter creates a booking request)
router.post("/", requireAuth, requireRole("renter"), async (req, res) => {
  try {
    const { propertyId, tenantName, tenantPhone, message } = req.body;
    if (!propertyId || !tenantName || !tenantPhone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (property.status !== "approved") {
      return res.status(400).json({ message: "This property is not yet approved by admin" });
    }
    if (!property.available) {
      return res.status(400).json({ message: "This property is not available" });
    }

    const booking = await Booking.create({
      ownerId: property.ownerId,
      propertyId: property._id,
      tenantId: req.user.id,
      tenantName,
      tenantPhone,
      message: message || "",
      status: "pending",
    });

    res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create booking" });
  }
});

// GET /api/bookings/mine (renter's own bookings)
router.get("/mine", requireAuth, requireRole("renter"), async (req, res) => {
  const bookings = await Booking.find({ tenantId: req.user.id })
    .populate("propertyId")
    .sort({ createdAt: -1 });
  res.json({ bookings });
});

// GET /api/bookings/owner (owner's incoming bookings)
router.get("/owner", requireAuth, requireRole("owner"), async (req, res) => {
  const bookings = await Booking.find({ ownerId: req.user.id })
    .populate("propertyId")
    .populate("tenantId", "name email")
    .sort({ createdAt: -1 });
  res.json({ bookings });
});

// GET /api/bookings (admin - all bookings)
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const bookings = await Booking.find({})
    .populate("propertyId")
    .populate("tenantId", "name email")
    .populate("ownerId", "name email")
    .sort({ createdAt: -1 });
  res.json({ bookings });
});

// PATCH /api/bookings/:id/status (owner or admin toggles pending/booked)
router.patch("/:id/status", requireAuth, requireRole("owner", "admin"), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (req.user.userType === "owner" && booking.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status } = req.body;
    if (!["pending", "booked", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    booking.status = status;
    await booking.save();
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to update booking" });
  }
});

module.exports = router;
