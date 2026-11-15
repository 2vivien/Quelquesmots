import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import WebSocket from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = WebSocket;
// Les requêtes simples passent par HTTP plutôt que WebSocket (plus fiable en démarrage à froid
// sur Neon) ; les transactions restent sur WebSocket.
neonConfig.poolQueryViaFetch = true;

const DEFAULT_POOL_MAX = 5;

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
