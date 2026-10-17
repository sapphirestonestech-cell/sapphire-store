import mongoose from "mongoose";

/** Read lazily so scripts that load env files after import still work. */
function mongoUri(): string {
  return process.env.MONGODB_URI ?? "";
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  __mongoose?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.__mongoose ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.__mongoose = cache;

/**
 * Connect to MongoDB, reusing the connection across hot reloads.
 * Throws with a clear message when MONGODB_URI is missing so pages
 * can show a proper error state instead of failing silently.
 */
export async function connectDb(): Promise<typeof mongoose> {
  const uri = mongoUri();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    );
  }
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
