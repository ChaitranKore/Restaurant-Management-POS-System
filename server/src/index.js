require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';
const rawOrigins = process.env.CLIENT_ORIGINS || '*';
// '*' must be passed through as-is (or `true`) rather than wrapped in an array —
// the `cors` package treats an array as an explicit allow-list and does an exact
// match, so ['*'] would reject every real origin instead of allowing all of them.
const CORS_ORIGINS =
  rawOrigins.trim() === '*'
    ? '*'
    : rawOrigins
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Run `npm run setup` to generate a .env file, or set it manually.');
    process.exit(1);
  }

  await connectDB(MONGO_URI);

  const app = createApp(CORS_ORIGINS);
  const server = http.createServer(app);

  initSocket(server, CORS_ORIGINS);

  server.listen(PORT, () => {
    console.log(`POS API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
