
const redisClient = require('../db/redisClient');

const applyRateLimit = async (mobile, limit, windowSeconds ) => {
  const key = `rate_limit:${mobile}`;
  const currentCount = await redisClient.hGet('rate_limiter', key);

  // Check if the current count exceeds the limit
  if (currentCount && parseInt(currentCount, 10) >= limit) {
    return false;

  }

  if (!currentCount) {
    // Set initial count to 1 with an expiry of `windowSeconds`
    await redisClient.hSet('rate_limiter', key, 1);
    await redisClient.expire('rate_limiter', windowSeconds);
  } else {
    // Increment the count
    await redisClient.hIncrBy('rate_limiter', key, 1);
  }

  return true;

};
module.exports = applyRateLimit;
