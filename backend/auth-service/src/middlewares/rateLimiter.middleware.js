/**
 * In-memory sliding window rate limiter middleware for sensitive auth routes
 */
const requestMap = new Map();

/**
 * Creates a rate limiter middleware
 * @param {number} windowMs - Window size in milliseconds (e.g., 15 * 60 * 1000 for 15 mins)
 * @param {number} maxRequests - Max requests allowed per IP within window
 */
const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 30) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    if (!requestMap.has(ip)) {
      requestMap.set(ip, []);
    }

    const timestamps = requestMap.get(ip).filter((ts) => now - ts < windowMs);
    timestamps.push(now);
    requestMap.set(ip, timestamps);

    if (timestamps.length > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
};

module.exports = rateLimiter;
