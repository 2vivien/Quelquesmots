/**
 * Lectures « textes » côté serveur (Server Components, images Open Graph).
 * Même repository et même cache Next.js (`unstable_cache`) que les routes API,
 * mais sans repasser par /api/* : pas d'aller-retour HTTP interne, pas besoin
 * de transmettre le cookie manuellement — le lecteur est passé explicitement.
 * Ne jamais importer depuis un composant client.
 */
import {
  getPostByIdFresh,
  getPostsByIds,
  listFeed,
  listRelated,
} from "@/lib/server/repository";
import type { FeedPage, FeedQuery, PostRecord, PostSummary } from "../types/posts.types";
import { canViewPost } from "../utils/visibility";

/** Page du mur éditorial (visibilité appliquée en SQL). */
export const serverPostsService = {
  listFeed(query: FeedQuery): Promise<FeedPage> {
    return listFeed(query);
  },

  /** Fiche d'un texte, ou `null` si introuvable / non visible pour ce lecteur.
   * Lecture directe (non cachée) : le compteur de vues affiché est toujours exact à l'ouverture. */
  async getById(id: string, viewerId: string | null): Promise<PostRecord | null> {
    const post = await getPostByIdFresh(id);
    return post && canViewPost(post, viewerId) ? post : null;
  },

  /** Textes visibles par le lecteur, dans l'ordre demandé. */
  getByIds(ids: string[], viewerId: string | null): Promise<PostSummary[]> {
    return getPostsByIds(ids, viewerId);
  },

  /** Textes liés (mêmes thèmes, 3 max). */
  listRelated(post: PostRecord, viewerId: string | null): Promise<PostSummary[]> {
    return listRelated(post, viewerId);
  },
} as const;
