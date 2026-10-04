const mongoose = require("mongoose");

// "Contact Admin" support requests.
const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: "" },
    category: {
      type: String,
      enum: ["account", "listing", "booking", "payment", "other"],
      default: "other",
    },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    adminReply: { type: String, default: "", maxlength: 2000 },
    repliedBy: { type: String, default: "" },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
