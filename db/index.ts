import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import WebSocket from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = WebSocket;

const DEFAULT_POOL_MAX = 5;

/** Erreurs transitoires de connexion (démarrage à froid Neon, WS coupé, fetch/résolution). */
const TRANSIENT_PATTERN = /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EPIPE|ENETUNREACH|EAI_AGAIN|fetch failed|ErrorEvent|connectionterminated|socket hang up|unexpected end of|remote end closed/i;

function isTransientDatabaseError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  // Détection directe : l'ErrorEvent du driver WebSocket n'expose pas toujours de props énumérables.
  const direct = (err as { name?: unknown; type?: unknown; code?: unknown; message?: unknown });
  if (direct.name === "ErrorEvent" || direct.type === "error") return true;
  if (typeof direct.code === "string" && TRANSIENT_PATTERN.test(direct.code)) return true;
  if (typeof direct.message === "string" && TRANSIENT_PATTERN.test(direct.message)) return true;
  // Chaîne de cause (DrizzleQueryError → NeonDbError → ErrorEvent).
  let cursor: unknown = err;
  for (let depth = 0; depth < 5; depth += 1) {
    const node = cursor as { name?: unknown; type?: unknown; code?: unknown; message?: unknown; cause?: unknown };
    if (node && typeof node === "object") {
      if (node.name === "ErrorEvent" || node.type === "error") return true;
      if (typeof node.code === "string" && TRANSIENT_PATTERN.test(node.code)) return true;
      if (typeof node.message === "string" && TRANSIENT_PATTERN.test(node.message)) return true;
      cursor = node.cause;
      continue;
    }
    return false;
  }
  return false;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => { setTimeout(resolve, ms); });

/** Rejoue une fois les erreurs transitoires (réseau Neon), sans masquer les erreurs logiques. */
async function withTransientRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 120): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !isTransientDatabaseError(error)) throw error;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastError;
}

function createDatabaseHandle() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL est requis pour utiliser PostgreSQL.");
  }

  const configuredMax = Number(process.env.DATABASE_POOL_MAX ?? DEFAULT_POOL_MAX);
  const max = Number.isInteger(configuredMax) && configuredMax > 0
    ? Math.min(configuredMax, 20)
    : DEFAULT_POOL_MAX;

  const pool = new Pool({ connectionString, max });
  // Enveloppe `pool.query` d'un retry borné sur erreurs transitoires (Neon) : requêtes isolées.
  const rawQuery = pool.query.bind(pool) as unknown as (...args: unknown[]) => Promise<unknown>;
  pool.query = (function retryingQuery(...args: unknown[]): unknown {
    const last = args[args.length - 1];
    // Les appels à callback traversent sans retry (pas utilisés par drizzle).
    if (typeof last === "function") return rawQuery(...args);
    return withTransientRetry(() => rawQuery(...args));
  }) as typeof pool.query;
  // Parcours transactionnels : `pool.connect()` + `client.query` reçoivent aussi le retry borné.
  const rawConnect = pool.connect.bind(pool) as unknown as (...args: unknown[]) => Promise<unknown>;
  pool.connect = (async function retryingConnect(...args: unknown[]): Promise<unknown> {
    const client = await withTransientRetry(() => rawConnect(...args) as Promise<unknown>);
    const c = client as { query?: (...qArgs: unknown[]) => Promise<unknown> };
    if (c?.query) {
      const rawClientQuery = c.query.bind(c);
      c.query = (...qArgs: unknown[]) => withTransientRetry(() => rawClientQuery(...qArgs));
    }
    return c;
  }) as unknown as typeof pool.connect;

  const db = drizzle({ client: pool, schema });

  return { db, pool };
}

type DatabaseHandle = ReturnType<typeof createDatabaseHandle>;

const globalForDatabase = globalThis as typeof globalThis & {
  __quelquesMotsDatabase?: DatabaseHandle;
};

/**
 * Accès PostgreSQL paresseux.
 * Ce module ne se connecte pas à la base à l'import et n'est appelé par aucune
 * route applicative dans cette phase de fondation.
 */
export function getDatabase() {
  globalForDatabase.__quelquesMotsDatabase ??= createDatabaseHandle();
  return globalForDatabase.__quelquesMotsDatabase.db;
}

/** À appeler uniquement par un arrêt gracieux explicite du processus. */
export async function closeDatabasePool(): Promise<void> {
  const handle = globalForDatabase.__quelquesMotsDatabase;
  if (!handle) return;
  await handle.pool.end();
  delete globalForDatabase.__quelquesMotsDatabase;
}
