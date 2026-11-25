const mongoose = require('mongoose');
const { env } = require('./env');

let cachedPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!cachedPromise) {
    mongoose.set('strictQuery', true);
    cachedPromise = mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    }).catch((err) => {
      cachedPromise = null;
      throw err;
    });
  }
  await cachedPromise;
  return mongoose.connection;
}

module.exports = { connectDB };
