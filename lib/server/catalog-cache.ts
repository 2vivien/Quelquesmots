import { Redis } from "@upstash/redis";

/**
 * Cache Upstash du catalogue éditorial (thèmes, tags, compteurs de publications).
 * En lecture seule pour l'utilisateur et rarement modifié (seed, publication) :
 * TTL de 120 s, repli immédiat sur la base si Redis est indisponible.
 */
const CATALOG_PREFIX = "qm:catalog:";
const CATALOG_TTL_SECONDS = 120;

let redisClient: Redis | null = null;
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient ??= new Redis({ url, token });
  return redisClient;
}

/** Lecture/écriture en cache d'une valeur catalogue (calcul à la demande). */
export async function withCatalogCache<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const redis = getRedisClient();
  if (!redis) return compute();
  const cacheKey = `${CATALOG_PREFIX}${key}`;
  try {
    const hit = await redis.get<T>(cacheKey);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    // Cache indisponible : on calcule directement sans bloquer.
  }
  const value = await compute();
  try {
    await redis.set(cacheKey, JSON.stringify(value), { ex: CATALOG_TTL_SECONDS });
  } catch {
    // Écriture best-effort.
  }
  return value;
}
