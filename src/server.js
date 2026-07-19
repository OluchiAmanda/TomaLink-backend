require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async (port = Number(PORT) || 5000, attempts = 0) => {
  // Connect to MongoDB first — only start accepting requests once the DB is ready.
  await connectDB();

  const server = app.listen(port, () => {
    console.log(
      `🚀 TomaLink server is running on port ${port} and connected to the database (${process.env.NODE_ENV || 'development'} mode)`
    );
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attempts < 5) {
      const nextPort = port + 1;
      console.warn(`Port ${port} in use, trying ${nextPort}...`);
      setTimeout(() => startServer(nextPort, attempts + 1), 200);
      return;
    }
    console.error('Server error:', err);
    process.exit(1);
  });

  return server;
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Catch unhandled promise rejections (e.g. a DB error that slipped through)
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
