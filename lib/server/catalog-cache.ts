import { Redis } from "@upstash/redis";
import { revalidatePublicCache } from "./data-cache";

/**
 * Cache Upstash du catalogue éditorial (thèmes, tags, compteurs de publications).
 * En lecture seule pour l'utilisateur et modifié uniquement par la publication,
 * la modération et les seeds. Invalidation explicite via `invalidateCatalog()`
 * après toute mutation du catalogue ; TTL de repli de 120 s.
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

/**
 * Invalide tout le cache catalogue après une mutation éditoriale
 * (publication, masquage/restauration/suppression d'un texte, reseed).
 * Fail-open : aucun appelant n'échoue si Redis est indisponible.
 */
export async function invalidateCatalog(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    revalidatePublicCache();
    let cursor = "0";
    const keys: string[] = [];
    do {
      const [next, found] = await redis.scan(cursor, { match: `${CATALOG_PREFIX}*`, count: 100 });
      keys.push(...found);
      cursor = Array.isArray(next) ? (next as unknown[]).join("") : String(next);
    } while (cursor !== "0");
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Invalidation best-effort ; le TTL gère la fraîcheur en secours.
  }
}
