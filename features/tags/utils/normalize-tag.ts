import { normalizeSearchText } from "@/lib/format";

/**
 * Normalise un libellé de tag en slug URL sans accent ni espace.
 * @param label Libellé saisi par l'auteur.
 * @returns Slug normalisé (sans `#`).
 */
export function normalizeTagSlug(label: string): string {
  return normalizeSearchText(label)
    .replace(/^#+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

/**
 * Déduplique et nettoie une liste de tags (maximum 5).
 * @param tags Liste brute de tags saisis.
 * @returns Tableau unique normalisé.
 */
export function deduplicateTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const slug = normalizeTagSlug(raw);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
    if (out.length >= 5) break;
  }
  return out;
}
