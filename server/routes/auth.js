const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");
const { sendMail, otpEmail } = require("../utils/mailer");

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000; // code is valid for 10 minutes
const OTP_RESEND_MS = 45 * 1000; // minimum gap between two codes for one email
const OTP_MAX_ATTEMPTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Slows down brute-force / spam on the OTP endpoints (per IP).
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      granted: user.granted,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const hashCode = (email, code) =>
  crypto.createHash("sha256").update(`${email}:${code}:${JWT_SECRET}`).digest("hex");

// ---------------------------------------------------------------------------
// Step 1 of registration: email a 6-digit code
// POST /api/auth/send-otp  { email }
// ---------------------------------------------------------------------------
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const existing = await Otp.findOne({ email });
    if (existing && Date.now() - existing.lastSentAt.getTime() < OTP_RESEND_MS) {
      const wait = Math.ceil((OTP_RESEND_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before requesting another code` });
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    await Otp.findOneAndUpdate(
      { email },
      {
        email,
        codeHash: hashCode(email, code),
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const { text, html } = otpEmail(code);
    await sendMail({ to: email, subject: "Your House Rent verification code", text, html });

    res.json({ message: "Verification code sent. Check your inbox (and spam folder).", expiresInSeconds: OTP_TTL_MS / 1000 });
  } catch (err) {
    console.error("send-otp error:", err.message);
    res.status(500).json({ message: "Could not send the verification email. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// Step 2: check the code. On success we hand back a short-lived signed token
// proving this email was verified; /register requires it.
// POST /api/auth/verify-otp  { email, otp }
// ---------------------------------------------------------------------------
router.post("/verify-otp", otpLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const otp = String(req.body.otp || "").trim();
    if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter the 6-digit code we emailed you" });
    }

    const record = await Otp.findOne({ email });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "This code has expired. Please request a new one." });
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await record.deleteOne();
      return res.status(429).json({ message: "Too many wrong attempts. Please request a new code." });
    }

    const expected = Buffer.from(record.codeHash, "hex");
    const given = Buffer.from(hashCode(email, otp), "hex");
    const ok = expected.length === given.length && crypto.timingSafeEqual(expected, given);

    if (!ok) {
      record.attempts += 1;
      await record.save();
      const left = OTP_MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({ message: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` });
    }

    await record.deleteOne(); // single use
    const verificationToken = jwt.sign({ email, purpose: "email-verified" }, JWT_SECRET, { expiresIn: "20m" });
    res.json({ verified: true, verificationToken });
  } catch (err) {
    console.error("verify-otp error:", err.message);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// Step 3: create the account (requires the verified-email token).
// Note: registering does NOT log the user in — they sign in with the
// credentials they just created.
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, userType, verificationToken } = req.body;
    if (!name || !email || !password || !userType) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Admin accounts must never be self-registered through the public API —
    // only "renter" and "owner" can sign up here. Admins are created via
    // server/seed.js (or promoted by an existing admin) with real DB access.
    if (!["renter", "owner"].includes(userType)) {
      return res.status(403).json({ message: "Only Renter and Owner accounts can be registered" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // The email must have been verified in the previous step.
    try {
      const decoded = jwt.verify(verificationToken || "", JWT_SECRET);
      if (decoded.purpose !== "email-verified" || decoded.email !== normalizedEmail) {
        return res.status(403).json({ message: "Email verification does not match. Please verify your email again." });
      }
    } catch (e) {
      return res.status(403).json({ message: "Please verify your email before registering." });
    }

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      // Same email is already registered. Only let this through if the
      // password matches too — that's the same person adding a second role
      // (e.g. an existing owner signing up as a renter). Different password
      // means someone else owns that email, so it's a real conflict.
      const passwordMatches = await bcrypt.compare(password, existing.password);
      if (!passwordMatches) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const existingRoles = existing.roles && existing.roles.length ? existing.roles : [existing.userType];
      if (existingRoles.includes(userType)) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      existing.roles = [...existingRoles, userType];
      existing.userType = userType;
      existing.emailVerified = true;
      await existing.save();

      return res.status(201).json({
        message: `Email verified. The ${userType} profile was added to your account — please sign in.`,
        email: existing.email,
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      userType,
      roles: [userType],
      emailVerified: true,
    });

    res.status(201).json({ message: "Email verified and account created. Please sign in.", email: normalizedEmail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ---------------------------------------------------------------------------
// Forgot password: same email-OTP proof as registration. The client first
// calls /send-otp and /verify-otp, then sends the verification token here.
// POST /api/auth/reset-password  { email, newPassword, verificationToken }
// ---------------------------------------------------------------------------
router.post("/reset-password", otpLimiter, async (req, res) => {
  try {
    const { email, newPassword, verificationToken } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();
    if (!normalizedEmail || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "Enter your email and a new password (min 6 characters)" });
    }
    try {
      const decoded = jwt.verify(verificationToken || "", JWT_SECRET);
      if (decoded.purpose !== "email-verified" || decoded.email !== normalizedEmail) {
        return res.status(403).json({ message: "Email verification does not match. Please verify again." });
      }
    } catch (e) {
      return res.status(403).json({ message: "Please verify your email first." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not reset password" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, loginAs } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const roles = user.roles && user.roles.length ? user.roles : [user.userType];

    // Account has more than one role (e.g. owner + renter) — the client
    // needs to say which one to log in as before we issue a token.
    if (roles.length > 1) {
      if (!loginAs) {
        return res.status(200).json({ needsRoleSelection: true, roles });
      }
      if (!roles.includes(loginAs)) {
        return res.status(400).json({ message: "Invalid role for this account" });
      }
      if (user.userType !== loginAs) {
        user.userType = loginAs;
        await user.save();
      }
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        roles,
        granted: user.granted,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

module.exports = router;
