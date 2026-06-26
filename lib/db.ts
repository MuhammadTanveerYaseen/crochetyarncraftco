import mongoose from 'mongoose';
import dns from 'node:dns/promises';

// Force public DNS resolvers to prevent ECONNREFUSED DNS resolution bugs on mongodb+srv URIs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('DNS server override failed:', err);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI environment variable is not defined in .env.local. Database operations might fail. Please configure MongoDB Atlas.');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache variable to maintain connection across hot reloads in development
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 1000, // Timeout after 1 second instead of 30 seconds
      connectTimeoutMS: 1000,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('Successfully connected to MongoDB.');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Error connecting to MongoDB:', e);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
