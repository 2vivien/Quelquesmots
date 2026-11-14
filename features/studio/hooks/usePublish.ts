"use client";

import { openAuthPopup } from "@/lib/open-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { postsService } from "@/features/posts";
import { publishSchema } from "../schemas/publish.schema";
import { useStudioStore } from "../stores/studio.store";

/**
 * Hook de validation et de publication d'un texte depuis le Studio.
 * @param saveNow Fonction de sauvegarde préalable du brouillon.
 * @returns État de publication et action `publish`.
 */
export function usePublish(saveNow: () => Promise<string | null>) {
  const { user } = useAuth();
  const router = useRouter();
  const store = useStudioStore();
  const [publishing, setPublishing] = useState(false);

  const publish = async (): Promise<void> => {
    if (!user) {
      openAuthPopup();
      return;
    }
    const parsed = publishSchema.safeParse({
      title: store.title,
      contentText: store.contentText,
      themeIds: store.themeIds,
      visibility: store.visibility,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Vérifiez votre texte.");
      return;
    }
    setPublishing(true);
    try {
      const draftId = await saveNow();
      if (!draftId) throw new Error("Sauvegarde impossible.");
      const published = await postsService.publishPost(draftId, user.id);
      if (!published) throw new Error("Publication impossible.");
      store.setField("publishOpen", false);
      toast.success("Votre texte est publié");
      router.push(`/mots/${published.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de publication.");
    } finally {
      setPublishing(false);
    }
  };

  return { publishing, publish };
}
