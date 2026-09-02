import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../lib/logger.js";

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose.
 * Safe to call multiple times — reuses the existing connection.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    isConnected = true;
    logger.info("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });

  isConnected = true;
  return mongoose;
}

/** Gracefully close the MongoDB connection. */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected");
  }
}

export function getConnectionState(): number {
  return mongoose.connection.readyState;
}

export { mongoose };
