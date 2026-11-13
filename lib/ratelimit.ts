const buckets = new Map<string, number[]>();

/**
 * Vérifie la limitation de débit par fenêtre glissante en mémoire.
 * @param key Identifiant unique (utilisateur ou action).
 * @param limit Nombre maximum d'appels autorisés dans la fenêtre.
 * @param windowMs Durée de la fenêtre en millisecondes.
 * @returns `true` si la requête est autorisée, `false` si la limite est dépassée.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const active = prev.filter((ts) => now - ts < windowMs);
  if (active.length >= limit) {
    buckets.set(key, active);
    return false;
  }
  active.push(now);
  buckets.set(key, active);
  return true;
}
