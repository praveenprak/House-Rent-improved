const express = require("express");
const Property = require("../models/Property");
const { upload, persistImages } = require("../utils/upload");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/properties  (PUBLIC listing — only approved + available properties show here)
// Supports filters: search (address/location), adType, propertyType, minPrice, maxPrice
router.get("/", async (req, res) => {
  try {
    const { search, adType, propertyType, minPrice, maxPrice } = req.query;
    const query = { status: "approved", available: true };

    if (search) {
      query.$or = [
        { address: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    if (adType && adType !== "all") query.adType = adType;
    if (propertyType && propertyType !== "all") query.propertyType = propertyType;
    if (minPrice || maxPrice) {
      query.amount = {};
      if (minPrice) query.amount.$gte = Number(minPrice);
      if (maxPrice) query.amount.$lte = Number(maxPrice);
    }

    const properties = await Property.find(query).sort({ createdAt: -1 });
    res.json({ properties });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch properties" });
  }
});

// GET /api/properties/mine (owner only — sees ALL of their own properties, any status)
router.get("/mine", requireAuth, requireRole("owner"), async (req, res) => {
  const properties = await Property.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
  res.json({ properties });
});

// GET /api/properties/admin/all (admin only — sees every property regardless of status)
router.get("/admin/all", requireAuth, requireRole("admin"), async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status && status !== "all") query.status = status;
  const properties = await Property.find(query).sort({ createdAt: -1 });
  res.json({ properties });
});

// GET /api/properties/:id (detail view)
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json({ property });
  } catch (err) {
    res.status(400).json({ message: "Invalid property id" });
  }
});

// POST /api/properties (owner only — new listings always start as "pending" for admin review)
router.post("/", requireAuth, requireRole("owner"), upload.array("images", 6), async (req, res) => {
  try {
    const { propertyType, adType, address, location, ownerContact, amount, details } = req.body;
    if (!propertyType || !adType || !address || !ownerContact) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const images = await persistImages(req.files);

    const property = await Property.create({
      ownerId: req.user.id,
      propertyType,
      adType,
      address,
      location: location || "",
      ownerContact,
      amount: Number(amount) || 0,
      details: details || "",
      images,
      status: "pending",
    });

    res.status(201).json({ property });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create property" });
  }
});

// PUT /api/properties/:id (owner of the property, or admin)
// If an OWNER edits an already-approved listing, it goes back to "pending" for re-review.
// Admin edits do not reset approval status.
router.put("/:id", requireAuth, upload.array("images", 6), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const isOwner = property.ownerId.toString() === req.user.id;
    const isAdmin = req.user.userType === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    const { propertyType, adType, address, location, ownerContact, amount, details, available } = req.body;
    if (propertyType) property.propertyType = propertyType;
    if (adType) property.adType = adType;
    if (address) property.address = address;
    if (location !== undefined) property.location = location;
    if (ownerContact) property.ownerContact = ownerContact;
    if (amount !== undefined) property.amount = Number(amount);
    if (details !== undefined) property.details = details;
    if (available !== undefined) property.available = available === "true" || available === true;

    if (req.files && req.files.length > 0) {
      property.images = await persistImages(req.files);
    }

    if (isOwner && !isAdmin) {
      property.status = "pending";
      property.rejectionReason = "";
    }

    await property.save();
    res.json({ property });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update property" });
  }
});

// PATCH /api/properties/:id/status (ADMIN ONLY — approve or reject a listing)
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    property.status = status;
    property.rejectionReason = status === "rejected" ? rejectionReason || "" : "";
    await property.save();
    res.json({ property });
  } catch (err) {
    res.status(500).json({ message: "Failed to update property status" });
  }
});

// PATCH /api/properties/:id/availability (owner or admin) - quick toggle, doesn't affect approval
router.patch("/:id/availability", requireAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const isOwner = property.ownerId.toString() === req.user.id;
    const isAdmin = req.user.userType === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    property.available = !property.available;
    await property.save();
    res.json({ property });
  } catch (err) {
    res.status(500).json({ message: "Failed to update availability" });
  }
});

// DELETE /api/properties/:id (owner or admin)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const isOwner = property.ownerId.toString() === req.user.id;
    const isAdmin = req.user.userType === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });

    await property.deleteOne();
    res.json({ message: "Property deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete property" });
  }
});

module.exports = router;
