const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 1000;

/** Retire les entrées complètement expirées ou vides pour éviter la croissance mémoire. */
function sweep(now: number): void {
  for (const [key, stamps] of buckets) {
    const active = stamps.filter((ts) => now - ts < 86_400_000);
    if (active.length === 0) buckets.delete(key);
    else buckets.set(key, active);
  }
  if (buckets.size <= MAX_BUCKETS) return;
  const oldest = [...buckets.entries()]
    .map(([key, stamps]) => [key, stamps[0] ?? 0] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, buckets.size - MAX_BUCKETS);
  for (const [key] of oldest) buckets.delete(key);
}

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
  if (buckets.size > MAX_BUCKETS) sweep(now);
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
