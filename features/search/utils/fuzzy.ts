import { normalizeSearchText } from "@/lib/format";

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr: number[] = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? i) + 1,
        (curr[j - 1] ?? j) + 1,
        (prev[j - 1] ?? i) + cost,
      );
    }
    prev = curr;
  }
  return prev[b.length] ?? 2;
}

/**
 * Vérifie une correspondance exacte ou tolérante à 1 lettre d'erreur.
 * @param haystack Texte où chercher.
 * @param needle Requête saisie par l'utilisateur.
 * @returns `true` si un mot correspond.
 */
export function isFuzzyMatch(haystack: string, needle: string): boolean {
  const cleanNeedle = normalizeSearchText(needle);
  if (!cleanNeedle) return true;
  const cleanHay = normalizeSearchText(haystack);
  if (cleanHay.includes(cleanNeedle)) return true;
  if (cleanNeedle.length < 4) return false;
  const words = cleanHay.split(/[^a-z0-9]+/).filter(Boolean);
  return words.some((w) => editDistance(w, cleanNeedle) <= 1);
}
