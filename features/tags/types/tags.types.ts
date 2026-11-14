/** Représentation d'un tag sur Quelques mots. */
export interface TagItem {
  id: string;
  label: string;
  useCount: number;
  status: "PENDING" | "APPROVED" | "BLOCKED";
}

/** Contrat du service de gestion des tags. */
export interface TagsService {
  listPopular(): Promise<TagItem[]>;
  suggestFromText(text: string): Promise<string[]>;
  getById(id: string): Promise<TagItem | null>;
}
