/** Représentation d'un tag sur Quelques mots. */
export interface TagItem {
  slug: string;
  label: string;
  useCount: number;
  status: "PENDING" | "APPROVED" | "BLOCKED";
}

/** Contrat du service de gestion des tags. */
export interface TagsService {
  listPopular(): Promise<TagItem[]>;
  suggestFromText(text: string): Promise<string[]>;
  getBySlug(slug: string): Promise<TagItem | null>;
}
