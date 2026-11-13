/** Catégorie regroupant les thèmes littéraires. */
export type ThemeCategory =
  | "Les émotions brutes et l'ombre"
  | "L'amour, le corps et l'intimité"
  | "L'esprit et la psychologie"
  | "La reconstruction et la lumière"
  | "La vie et le temps";

/** Représentation d'un thème littéraire purement typographique (sans image). */
export interface ThemeItem {
  id: string;
  slug: string;
  name: string;
  category: ThemeCategory;
  tagline: string;
  position: number;
  postCount: number;
  tagCount: number;
  relatedTags: string[];
  active: boolean;
}

/** Contrat du service des thèmes (mock et réel). */
export interface ThemesService {
  listActive(query?: string): Promise<ThemeItem[]>;
  getBySlug(slug: string): Promise<ThemeItem | null>;
}
