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
  const excerpt = plain.replace(/\n+/g, " ").trim().slice(0, 140);
  return {
    id: state.draftId ?? undefined,
    authorId: user.id,
    authorUsername: user.username,
    authorFirstName: user.firstName,
    authorLastName: user.lastName,
    authorAvatarUrl: user.avatarUrl,
    publishAs: user.defaultPublishAs,
    title: state.title.trim() || "Sans titre",
    excerpt,
    contentJson: cleanJson,
    contentText: plain,
    tagIds: state.themeIds,
    themeIds: state.themeIds,
    visibility: state.visibility,
  };
}
