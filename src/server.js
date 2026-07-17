require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB first — only start accepting requests once the DB is ready.
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `🚀 TomaLink server is running on port ${PORT} and connected to the database (${process.env.NODE_ENV || 'development'} mode)`
    );
  });
};

startServer();

// Catch unhandled promise rejections (e.g. a DB error that slipped through)
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});
