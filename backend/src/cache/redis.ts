import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function connectRedis() {
  if (redisClient) return redisClient;

  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  redisClient.on('connect', () => console.log('Redis Client Connected'));

  await redisClient.connect();
  return redisClient;
}

export function getRedis() {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Cache helpers
export async function setCache(key: string, value: any, expirationSeconds?: number) {
  const client = getRedis();
  const serialized = JSON.stringify(value);
  
  if (expirationSeconds) {
    await client.setEx(key, expirationSeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedis();
  const value = await client.get(key);
  
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function deleteCache(key: string) {
  const client = getRedis();
  await client.del(key);
}

export async function deleteCachePattern(pattern: string) {
  const client = getRedis();
  const keys = await client.keys(pattern);
  
  if (keys.length > 0) {
    await client.del(keys);
  }
}
