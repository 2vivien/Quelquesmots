import { normalizeSearchText } from "@/lib/format";
import type { ThemeItem, ThemesService } from "../types/themes.types";
import { MOCK_THEMES } from "./themes.mock-data";

const runtimeThemes = [...MOCK_THEMES];

/** Met à jour un thème en mémoire (administration mock). */
export function upsertMockTheme(item: ThemeItem): void {
  const idx = runtimeThemes.findIndex((t) => t.id === item.id);
  if (idx >= 0) {
    runtimeThemes[idx] = item;
  } else {
    runtimeThemes.push(item);
  }
}

/** Implémentation mock du service des thèmes. */
export const themesMock: ThemesService = {
  async listActive(query?: string): Promise<ThemeItem[]> {
    const clean = normalizeSearchText(query ?? "");
    return runtimeThemes
      .filter((t) => t.active)
      .filter((t) => {
        if (!clean) return true;
        return (
          normalizeSearchText(t.name).includes(clean) ||
          normalizeSearchText(t.tagline).includes(clean)
        );
      })
      .sort((a, b) => a.position - b.position);
  },
  async getBySlug(slug: string): Promise<ThemeItem | null> {
    return runtimeThemes.find((t) => t.slug === slug && t.active) ?? null;
  },
};
