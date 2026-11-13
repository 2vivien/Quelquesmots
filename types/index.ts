/** Mode de signature choisi pour publier un texte. */
export type PublishAs = "USERNAME" | "REAL_NAME" | "ANONYMOUS";

/** Niveau de visibilité d'un texte publié ou brouillon. */
export type Visibility = "PUBLIC" | "PRIVATE";

/** Statut éditorial d'un texte. */
export type PostStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UNDER_REVIEW"
  | "HIDDEN"
  | "DELETED";

/** Marque typographique Tiptap autorisée. */
export interface TiptapMark {
  type: "bold" | "italic";
}

/** Noeud structuré d'un document Tiptap. */
export interface TiptapNode {
  type: string;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
}

/** Document Tiptap racine sérialisé en JSON. */
export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

/** Rôle utilisateur dans la plateforme. */
export type UserRole = "user" | "moderator" | "admin";
