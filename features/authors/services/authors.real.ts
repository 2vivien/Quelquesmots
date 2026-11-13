import { apiUrl } from "@/lib/env";
import type { AuthorProfile, AuthorsService } from "../types/authors.types";

/** Implémentation réelle du service des auteurs via API. */
export const authorsReal: AuthorsService = {
  async listDirectory(query?: string): Promise<AuthorProfile[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await fetch(apiUrl(`/api/authors${qs}`));
    if (!res.ok) return [];
    const data = (await res.json()) as { authors: AuthorProfile[] };
    return data.authors;
  },
  async getByUsername(username: string): Promise<AuthorProfile | null> {
    const res = await fetch(apiUrl(`/api/authors/${encodeURIComponent(username)}`));
    if (!res.ok) return null;
    const data = (await res.json()) as { author: AuthorProfile | null };
    return data.author;
  },
  async isUsernameAvailable(username: string): Promise<boolean> {
    const res = await fetch(
      apiUrl(`/api/authors/available?username=${encodeURIComponent(username)}`),
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { available: boolean };
    return data.available;
  },
};
