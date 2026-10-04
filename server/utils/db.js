const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/HouseRent";

// Serverless functions (Vercel) start fresh often, so we cache the connection
// promise on `global` and reuse it across invocations instead of reconnecting.
let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .then((m) => m)
      .catch((err) => {
        cached.promise = null; // allow retry on next request
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
