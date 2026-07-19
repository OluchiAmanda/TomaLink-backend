const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Logs a clear success message once connected, or exits the process on failure
 * so the app never runs silently without a database.
 */
const connectDB = async () => {
  const configured = process.env.DATABASE_URL;
  const localFallback = 'mongodb://localhost:27017/tomalink';

  const tryConnect = async (uri) => {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(
      `✅ MongoDB connected successfully — host: ${conn.connection.host}, db: ${conn.connection.name}`
    );
    return conn;
  };

  try {
    if (configured) return await tryConnect(configured);
    return await tryConnect(localFallback);
  } catch (error) {
    // If initial configured URL failed and it's different from the local fallback,
    // attempt to connect to the local fallback before exiting. This helps dev
    // environments where .env might be absent or CI/host overrides are present.
    if (configured && configured !== localFallback) {
      console.warn(`Configured DATABASE_URL failed — trying local fallback (${localFallback})`);
      try {
        return await tryConnect(localFallback);
      } catch (err) {
        console.error(`❌ MongoDB connection failed (both configured and fallback): ${err.message}`);
        process.exit(1);
      }
    }

    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
