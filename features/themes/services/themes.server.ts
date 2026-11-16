/**
 * Lectures catalogue côté serveur (Server Components).
 * Même données que /api/themes, sans détour HTTP. Ne pas importer côté client.
 */
import { getThemeById, listThemes } from "@/lib/server/repository";

export const serverThemesService = {
  listActive: listThemes,
  getById: getThemeById,
} as const;
