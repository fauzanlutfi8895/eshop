import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error("Redis URL is not defined in environment variables.");
}

const redis = new Redis(redisUrl);

export default redis;
