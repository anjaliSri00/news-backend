const redis = require('redis');
const config = require('../config/config');

const redisUrl = process.env.NODE_ENV === 'production'
  ? `redis://:${config.redis.password}@${config.redis.host}:${config.redis.port}`
  : `redis://${config.redis.host}:${config.redis.port}`;

  //console.log('Redis URL-----------------------------------------------------------------------:', redisUrl);
const redisClient = redis.createClient({
  url: redisUrl,});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

module.exports = redisClient;