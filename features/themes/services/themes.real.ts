import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { ThemeItem, ThemesService } from "../types/themes.types";

/** Implémentation réelle du service des thèmes via API. */
export const themesReal: ThemesService = {
  async listActive(query?: string): Promise<ThemeItem[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await fetch(apiUrl(`/api/themes${qs}`));
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de charger les thèmes."));
    const data = (await res.json()) as { themes: ThemeItem[] };
    return data.themes;
  },
  async getById(id: string): Promise<ThemeItem | null> {
    const res = await fetch(apiUrl(`/api/themes/${encodeURIComponent(id)}`));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de charger ce thème."));
    const data = (await res.json()) as { theme: ThemeItem | null };
    return data.theme;
  },
};
