import { apiUrl } from "@/lib/env";
import type { ThemeItem, ThemesService } from "../types/themes.types";

/** Implémentation réelle du service des thèmes via API. */
export const themesReal: ThemesService = {
  async listActive(query?: string): Promise<ThemeItem[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await fetch(apiUrl(`/api/themes${qs}`));
    if (!res.ok) return [];
    const data = (await res.json()) as { themes: ThemeItem[] };
    return data.themes;
  },
  async getById(id: string): Promise<ThemeItem | null> {
    const res = await fetch(apiUrl(`/api/themes/${encodeURIComponent(id)}`));
    if (!res.ok) return null;
    const data = (await res.json()) as { theme: ThemeItem | null };
    return data.theme;
  },
  async getBySlug(slug: string): Promise<ThemeItem | null> {
    const res = await fetch(apiUrl(`/api/themes/${encodeURIComponent(slug)}`));
    if (!res.ok) return null;
    const data = (await res.json()) as { theme: ThemeItem | null };
    return data.theme;
  },
};
