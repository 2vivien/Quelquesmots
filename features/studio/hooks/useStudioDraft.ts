"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth";
import { postsService } from "@/features/posts";
import { extractPlainText } from "@/lib/sanitize";
import type { TiptapDoc } from "@/types";
import { useStudioStore } from "../stores/studio.store";
import { buildDraftPayload } from "../utils/draft-payload";

/**
 * Hook gérant le chargement et la sauvegarde automatique (1,5 s) d'un brouillon du Studio.
 * @param initialDraftId Identifiant d'un brouillon existant.
 */
export function useStudioDraft(initialDraftId?: string) {
  const { user } = useAuth();
  const state = useStudioStore();

  useEffect(() => {
    if (!initialDraftId) { state.reset(); return; }
    void postsService.getById(initialDraftId).then((post) => {
      if (!post || (user && post.authorId !== user.id)) return;
      state.reset({
        draftId: post.id,
        title: post.title === "Sans titre" ? "" : post.title,
        contentJson: post.contentJson,
        contentText: post.contentText,
        themeSlugs: post.themeSlugs.slice(0, 5),
        visibility: post.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftId]);

  const saveNow = async (): Promise<string | null> => {
    if (!user) return null;
    state.setField("saveStatus", "saving");
    try {
      const saved = await postsService.upsertDraft(buildDraftPayload(user, state));
      state.setField("draftId", saved.id);
      state.setField("saveStatus", "saved");
      return saved.id;
    } catch {
      state.setField("saveStatus", "error");
      return null;
    }
  };

  useEffect(() => {
    if (!state.title && !state.contentText) return;
    const t = setTimeout(() => { void saveNow(); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.title, state.contentText, state.themeSlugs, state.visibility]);

  const applyDoc = (doc: TiptapDoc) => {
    state.setField("contentJson", doc);
    state.setField("contentText", extractPlainText(doc));
  };
  return { saveNow, applyDoc };
}
