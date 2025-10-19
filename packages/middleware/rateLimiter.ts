import { Response, NextFunction } from "express";
import redis from "@packages/libs/redis";
import { ValidationError } from "@packages/error-handler";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Redis key prefix
}

export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.seller?.id || req.user?.id || req.ip;
      const key = `${options.keyPrefix}:${userId}`;

      // Get current count
      const current = await redis.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= options.maxRequests) {
        const ttl = await redis.ttl(key);
        const minutesLeft = Math.ceil(ttl / 60);
        return next(
          new ValidationError(
            `Rate limit exceeded. You can upload up to ${
              options.maxRequests
            } banners per hour. Please try again in ${minutesLeft} minute${
              minutesLeft > 1 ? "s" : ""
            }.`
          )
        );
      }

      // Increment counter
      if (count === 0) {
        await redis.setex(key, Math.floor(options.windowMs / 1000), "1");
      } else {
        await redis.incr(key);
      }

      // Add rate limit info to response headers
      res.setHeader("X-RateLimit-Limit", options.maxRequests.toString());
      res.setHeader(
        "X-RateLimit-Remaining",
        (options.maxRequests - count - 1).toString()
      );

      next();
    } catch (error) {
      console.error("Rate limiter error:", error);
      // If Redis fails, allow the request to proceed (fail open)
      next();
    }
  };
};

// Specific rate limiter for banner uploads
// 5 uploads per hour
export const bannerUploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 uploads per hour
  keyPrefix: "banner_upload",
});
