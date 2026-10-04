const mongoose = require("mongoose");

// One pending verification code per email. MongoDB deletes the document
// automatically once `expiresAt` passes (TTL index), so stale codes never pile up.
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

module.exports = mongoose.model("Otp", otpSchema);
