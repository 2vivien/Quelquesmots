/**
 * Formate un compteur numérique en notation éditoriale française (ex. 2400 → 2,4k).
 * @param count Valeur numérique à formater.
 * @returns Chaîne formatée pour l'affichage.
 */
export function formatCount(count: number): string {
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1).replace(".", ",").replace(",0", "");
    return `${k}k`;
  }
  return new Intl.NumberFormat("fr-FR").format(count);
}

/**
 * Formate une date ISO en date courte déterministe (UTC) pour un rendu SSR sans divergence.
 * @param isoDate Date ISO source.
 * @returns Date lisible en français (ex. « 12 nov. 2026 »).
 */
export function formatStaticDate(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

/**
 * Formate une date ISO en temps relatif lisible en français.
 * @param isoDate Date ISO source.
 * @returns Libellé relatif (ex. « il y a 12 min », « hier »).
 */
export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60_000));
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  return formatStaticDate(isoDate);
}

/**
 * Normalise une chaîne pour la recherche tolérante (minuscules, sans accents).
 * @param value Texte source.
 * @returns Chaîne normalisée.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
