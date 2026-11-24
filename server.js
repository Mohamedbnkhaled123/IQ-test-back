const { env } = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const app = require('./src/app');

async function startServer() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`IQ Quiz backend listening on port ${env.port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
