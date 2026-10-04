const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    propertyType: { type: String, enum: ["residential", "commercial"], required: true },
    adType: { type: String, enum: ["rent", "sale"], required: true },
    address: { type: String, required: true },
    location: { type: String, default: "" }, // city / area, used for location filtering
    images: [{ type: String }],
    ownerContact: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
    details: { type: String, default: "" },
    available: { type: Boolean, default: true },
    // Broker-style moderation: nothing is publicly visible until an Admin approves it.
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
