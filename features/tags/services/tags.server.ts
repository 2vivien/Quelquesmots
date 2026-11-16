/**
 * Lectures tags côté serveur (Server Components).
 * Même données que /api/tags, sans détour HTTP. Ne pas importer côté client.
 */
import { getTagById, listTags } from "@/lib/server/repository";

export const serverTagsService = {
  listPopular: listTags,
  getById: getTagById,
} as const;
