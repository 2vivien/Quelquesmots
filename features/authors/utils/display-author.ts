import type { DisplayAuthorInput } from "../types/authors.types";

/**
 * Résout le nom public d'un auteur selon son choix de signature.
 * Règle métier unique utilisée partout dans l'interface et les métadonnées.
 * @param input Paramètres de signature et d'identité.
 * @returns Le libellé public à afficher et un booléen indiquant si le profil est cliquable.
 */
export function displayAuthor(input: DisplayAuthorInput): {
  label: string;
  href: string | null;
} {
  if (input.publishAs === "ANONYMOUS") {
    return { label: "Anonyme", href: null };
  }
  if (input.publishAs === "REAL_NAME") {
    const full = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
    if (full.length > 0) {
      return { label: full, href: `/auteurs/${input.userId ?? input.username}` };
    }
  }
  return { label: input.username, href: `/auteurs/${input.userId ?? input.username}` };
}
