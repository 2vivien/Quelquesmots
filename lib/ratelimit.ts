import { sql } from "drizzle-orm";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getDatabase } from "@/db";

/**
 * Limitation de débit partagée entre instances.
 * Cible : Upstash Redis en ligne (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
 * Replis : table PostgreSQL `rate_limits` (incrément atomique) si Upstash n'est pas configuré ;
 * en cas de panne des deux, fail-open (la requête passe, l'échec surfacera sur la cible réelle).
 */

let redisClient: Redis | null = null;
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisClient ??= new Redis({ url, token });
  return redisClient;
}

const limiters = new Map<string, Ratelimit>();

/** Limiter Upstash dédupliqué par (limite, fenêtre) — instancié une seule fois par processus. */
function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;
  const cacheKey = `${limit}:${windowMs}`;
  const cached = limiters.get(cacheKey);
  if (cached) return cached;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, `${Math.max(1, Math.ceil(windowMs / 1000))} s`),
    prefix: "qm:ratelimit",
    timeout: 1_000,
    ephemeralCache: new Map(),
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

/** Incrément atomique dans PostgreSQL (repli quand Upstash n'est pas configuré). */
async function checkRateLimitPostgres(key: string, limit: number, windowMs: number): Promise<boolean> {
  const db = getDatabase();
  const result = await db.execute(sql`
      insert into rate_limits (key, window_start, count)
      values (${key}, now(), 1)
      on conflict (key) do update
        set count = case
                      when now() - rate_limits.window_start > make_interval(secs => ${windowMs} / 1000.0)
                      then 1
                      else rate_limits.count + 1
                    end,
            window_start = case
                      when now() - rate_limits.window_start > make_interval(secs => ${windowMs} / 1000.0)
                      then now()
                      else rate_limits.window_start
                    end
      returning count
    `);
  const raw = (result.rows[0] as { count?: unknown } | undefined)?.count;
  const count = typeof raw === "number" ? raw : Number(raw ?? 1);
  if (Number.isNaN(count) || count <= 1) {
    // Fenêtre expirée (count <= 1) : on purge les vieilles clés au fil de l'eau.
    if (Math.random() < 0.01) {
      db.execute(sql`delete from rate_limits where now() - window_start > interval '1 day'`).catch(() => undefined);
    }
  }
  return count <= limit;
}

/**
 * Vérifie la limitation de débit par fenêtre fixe.
 * @param key Identifiant unique (utilisateur, route, action).
 * @param limit Nombre d'appels autorisés dans la fenêtre.
 * @param windowMs Durée de la fenêtre en millisecondes.
 * @param critical Si `true` (routes sensibles : auth, publications, uploads, compte…), un échec
 *                 total Redis+PostgreSQL ferme la requête au lieu de laisser passer l'abus.
 *                 Si `false` (lectures non destructives), l'incident est loggé et autorisé.
 * @returns `true` si la requête est autorisée, `false` si la limite est dépassée ou si le contrôle est indisponible en mode critique.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  critical = false,
): Promise<boolean> {
  const limiter = getUpstashLimiter(limit, windowMs);
  if (limiter) {
    try {
      const res = await limiter.limit(key);
      return res.success;
    } catch (error) {
      // Redis indisponible : on tente le repli PostgreSQL.
      console.error(`Rate limit Redis down${critical ? " (critical)" : ""} :`, error);
    }
  }
  try {
    return await checkRateLimitPostgres(key, limit, windowMs);
  } catch (error) {
    console.error(`Rate limit indisponible${critical ? " (critical)" : ""} :`, error);
    return critical ? false : true;
  }
}
