import { sql } from "drizzle-orm";
import { getDatabase } from "@/db";

/** Supprime les fenêtres expirées (nettoie au fil de l'eau, pas de démon dédié). */
async function sweepExpired(): Promise<void> {
  const db = getDatabase();
  await db.execute(sql`delete from rate_limits where now() - window_start > interval '1 day'`);
}

/**
 * Limitation de débit partagée entre instances (PostgreSQL, incrément atomique par clé).
 * Fenêtre fixe de `windowMs` millisecondes à partir de la première requête de la fenêtre.
 * Fail-open : si la base est injoignable, la requête est autorisée (l'échec surfacera sur la cible réelle).
 * @param key Identifiant unique (utilisateur, route, action).
 * @param limit Nombre maximum d'appels autorisés dans la fenêtre.
 * @param windowMs Durée de la fenêtre en millisecondes.
 * @returns `true` si la requête est autorisée, `false` si la limite est dépassée.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  try {
    const db = getDatabase();
    // Incrément atomique : une seule requête, pas de SELECT puis UPDATE non atomiques.
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
      // Première requête de la fenêtre (count <= 1) : occasionnellement on purge les vieilles clés.
      if (Math.random() < 0.01) sweepExpired().catch(() => undefined);
    }
    return count <= limit;
  } catch (error) {
    console.error("Limitation de débit indisponible (fail-open) :", error);
    return true;
  }
}
