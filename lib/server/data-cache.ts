import { revalidateTag } from "next/cache";

/**
 * Tag commun pour toutes les lectures publiques mises en cache (Next Data Cache).
 * Toute mutation publique appelle `revalidatePublicCache()`.
 */
export const PUBLIC_CACHE_TAG = "qm-catalog" as const;

/**
 * Invalide le Data Cache public. Fail-open : silencieux si exécuté hors runtime Next
 * (scripts standalone, seed) où `revalidateTag` n'existe pas.
 */
export function revalidatePublicCache(): void {
  try {
    revalidateTag(PUBLIC_CACHE_TAG);
  } catch {
    // Hors runtime Next (script/seed) : rien à invalider.
  }
}
