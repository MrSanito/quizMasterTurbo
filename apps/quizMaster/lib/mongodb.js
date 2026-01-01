import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

/** * Check if we already have a connection cached in the global object.
 * If not, initialize the cache object.
 */
let cached = global.mongoose;

if (!cached) {
  // ✅ This is the part that was likely missing or incomplete:
  // We MUST assign it to global so it survives file reloads.
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Store the promise so multiple rapid calls don't start multiple connections
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on error to allow retrying
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
