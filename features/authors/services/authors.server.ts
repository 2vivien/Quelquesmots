/**
 * Lectures auteurs côté serveur (Server Components).
 * Même données que /api/authors, sans détour HTTP. Ne pas importer côté client.
 */
import { getAuthorById, listAuthors } from "@/lib/server/repository";

export const serverAuthorsService = {
  listDirectory: listAuthors,
  getById: getAuthorById,
} as const;
