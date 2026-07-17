const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Logs a clear success message once connected, or exits the process on failure
 * so the app never runs silently without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL);

    console.log(
      `✅ MongoDB connected successfully — host: ${conn.connection.host}, db: ${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
