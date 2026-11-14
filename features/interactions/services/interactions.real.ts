import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { InteractionState, InteractionsService } from "../types/interactions.types";

/** Message d'erreur métier porté par le corps standardisé des routes API. */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  return apiErrorMessage(res, fallback);
}

/** Bascule authentifiée ; expose les erreurs serveur plutôt que de simuler un succès. */
async function togglePost<T>(url: string, fallback: string): Promise<T> {
  const res = await fetch(apiUrl(url), { method: "POST" });
  if (!res.ok) throw new Error(await readErrorMessage(res, fallback));
  return (await res.json()) as T;
}

/** Implémentation réelle du service d'interactions via API Next.js. */
export const interactionsReal: InteractionsService = {
  async getUserState(): Promise<InteractionState> {
    const res = await fetch(apiUrl("/api/interactions/state"));
    if (!res.ok) throw new Error(await readErrorMessage(res, "Impossible de charger vos interactions."));
    return (await res.json()) as InteractionState;
  },
  async toggleLike(_userId: string, postId: string): Promise<{ liked: boolean }> {
    return togglePost(`/api/posts/${encodeURIComponent(postId)}/like`, "Impossible d'enregistrer votre réaction.");
  },
  async toggleDislike(_userId: string, postId: string): Promise<{ disliked: boolean }> {
    return togglePost(`/api/posts/${encodeURIComponent(postId)}/dislike`, "Impossible d'enregistrer votre réaction.");
  },
  async toggleBookmark(_userId: string, postId: string): Promise<{ bookmarked: boolean }> {
    return togglePost(`/api/posts/${encodeURIComponent(postId)}/bookmark`, "Impossible de mettre à jour la bibliothèque.");
  },
  async recordView(postId: string): Promise<boolean> {
    const res = await fetch(apiUrl(`/api/posts/${encodeURIComponent(postId)}/view`), { method: "POST" });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(await readErrorMessage(res, "Impossible d'enregistrer cette consultation."));
    const data = (await res.json().catch(() => null)) as { counted?: boolean } | null;
    return data?.counted ?? false;
  },
  async toggleBlockUser(_blockerId: string, targetUserId: string): Promise<{ blocked: boolean }> {
    return togglePost(`/api/users/${encodeURIComponent(targetUserId)}/block`, "Impossible de bloquer cet auteur.");
  },
  async toggleFollow(_followerId: string, targetUserId: string): Promise<{ following: boolean }> {
    return togglePost(`/api/users/${encodeURIComponent(targetUserId)}/follow`, "Impossible de mettre à jour le suivi.");
  },
};
