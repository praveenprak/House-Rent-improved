// Optional helper: creates default admin accounts so you can access /admin.
// Run with:  node seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/HouseRent";

// Add as many admin accounts here as you need — each one gets created if it
// doesn't already exist. Change these before running in a real deployment.
const ADMINS = [
  { name: "Admin One", email: "admin1@houserent.com", password: "Admin@123" },
  { name: "Admin Two", email: "admin2@houserent.com", password: "Admin@456" },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  for (const admin of ADMINS) {
    const existing = await User.findOne({ email: admin.email });
    if (existing) {
      console.log(`Admin already exists: ${admin.email}`);
      continue;
    }

    const hashed = await bcrypt.hash(admin.password, 10);
    await User.create({
      name: admin.name,
      email: admin.email,
      password: hashed,
      userType: "admin",
      granted: true,
    });

    console.log("Admin account created:");
    console.log(`  Email:    ${admin.email}`);
    console.log(`  Password: ${admin.password}`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
