import type { AuthUser } from "@/features/auth";
import type { PostRecord } from "@/features/posts";
import { extractPlainText, sanitizeTiptapDoc } from "@/lib/sanitize";
import type { StudioFields } from "../stores/studio.store";

/**
 * Construit le brouillon normalisé prêt pour la sauvegarde.
 * @param user Session de l'auteur.
 * @param state État courant du Studio.
 * @returns Objet partiel compatible avec `postsService.upsertDraft`.
 */
export function buildDraftPayload(
  user: AuthUser,
  state: StudioFields,
): Partial<PostRecord> & { authorId: string } {
  const cleanJson = sanitizeTiptapDoc(state.contentJson);
  const plain = extractPlainText(cleanJson);
  return {
    id: state.draftId ?? undefined,
    authorId: user.id,
    authorUsername: user.username,
    authorFirstName: user.firstName,
    authorLastName: user.lastName,
    authorAvatarUrl: user.avatarUrl,
    publishAs: user.defaultPublishAs,
    title: state.title.trim() || "Sans titre",
    excerpt: plain.slice(0, 140),
    contentJson: cleanJson,
    contentText: plain,
    tagSlugs: state.themeSlugs,
    themeSlugs: state.themeSlugs,
    visibility: state.visibility,
  };
}
