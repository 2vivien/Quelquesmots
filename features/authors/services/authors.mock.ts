import { normalizeSearchText } from "@/lib/format";
import type { AuthorProfile, AuthorsService } from "../types/authors.types";
import { MOCK_AUTHORS } from "./authors.mock-data";

const runtimeAuthors = [...MOCK_AUTHORS];

/** Ajoute ou met à jour un profil auteur dans le stockage mock en mémoire. */
export function upsertMockAuthor(profile: AuthorProfile): void {
  const idx = runtimeAuthors.findIndex((a) => a.userId === profile.userId);
  if (idx >= 0) {
    runtimeAuthors[idx] = profile;
  } else {
    runtimeAuthors.push(profile);
  }
}

/** Implémentation mock du service des auteurs. */
export const authorsMock: AuthorsService = {
  async listDirectory(query?: string): Promise<AuthorProfile[]> {
    const clean = normalizeSearchText(query ?? "");
    return runtimeAuthors.filter((a) => {
      if (!a.listedInDirectory || a.status !== "ACTIVE") return false;
      if (!clean) return true;
      return (
        normalizeSearchText(a.username).includes(clean) ||
        normalizeSearchText(a.bio).includes(clean)
      );
    });
  },
  async getByUsername(username: string): Promise<AuthorProfile | null> {
    const target = normalizeSearchText(username);
    return (
      runtimeAuthors.find(
        (a) =>
          normalizeSearchText(a.username) === target && a.status === "ACTIVE",
      ) ?? null
    );
  },
  async isUsernameAvailable(username: string): Promise<boolean> {
    const target = normalizeSearchText(username);
    return !runtimeAuthors.some(
      (a) => normalizeSearchText(a.username) === target,
    );
  },
};
