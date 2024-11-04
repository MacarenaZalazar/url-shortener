import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await redisClient.connect();
})();
// Función para setear una clave con TTL
export const setCache = async (key: string, value: any, ttl: number) => {
  await redisClient.set(key, JSON.stringify(value), { EX: ttl }); // EX establece el TTL en segundos
};

export const getCache = async (key: string) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};
export default redisClient;
