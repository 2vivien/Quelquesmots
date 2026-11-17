"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/features/auth";
import { postsService } from "@/features/posts";
import { apiUrl } from "@/lib/env";
import { extractPlainText } from "@/lib/sanitize";
import type { TiptapDoc } from "@/types";
import { useStudioStore } from "../stores/studio.store";
import { buildDraftPayload } from "../utils/draft-payload";

/**
 * Hook gérant le chargement et la sauvegarde automatique (1,5 s) d'un brouillon du Studio.
 * Garanties :
 * - chargement annulé proprement, jamais d'écrasement d'un texte en cours
 *   (`loadStatus: "loading"` verrouille l'édition jusqu'à la fin du chargement) ;
 * - au plus une sauvegarde active ; les modifications en cours sont regroupées (la dernière gagne) ;
 * - avant destruction du composant (navigation/fermeture), une sauvegarde `keepalive` est déclenchée.
 * @param initialDraftId Identifiant d'un brouillon existant.
 */
export function useStudioDraft(initialDraftId?: string) {
  const { user } = useAuth();
  const state = useStudioStore();
  const loadFinishedRef = useRef(!initialDraftId); // prêt immédiatement si pas de brouillon à charger
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ─── Chargement du brouillon existant (annulé proprement au démontage) ───
  useEffect(() => {
    if (!initialDraftId) {
      state.reset();
      dirtyRef.current = false;
      loadFinishedRef.current = true;
      return;
    }
    let cancelled = false;
    loadFinishedRef.current = false;
    useStudioStore.setState({ loadStatus: "loading" });
    postsService
      .getById(initialDraftId)
      .then((post) => {
        if (cancelled) return;
        if (!post || (userRef.current && post.authorId !== userRef.current.id)) {
          loadFinishedRef.current = true;
          useStudioStore.setState({ loadStatus: "ready" });
          return;
        }
        state.reset({
          draftId: post.id,
          title: post.title === "Sans titre" ? "" : post.title,
          contentJson: post.contentJson,
          contentText: post.contentText,
          themeIds: post.themeIds.slice(0, 5),
          visibility: post.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        });
        dirtyRef.current = false;
        loadFinishedRef.current = true;
        useStudioStore.setState({ loadStatus: "ready" });
      })
      .catch(() => {
        if (cancelled) return;
        // Brouillon introuvable ou inaccessible : on ouvre un Studio vide plutôt que de bloquer la page.
        state.reset();
        dirtyRef.current = false;
        loadFinishedRef.current = true;
        useStudioStore.setState({ loadStatus: "ready" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftId]);

  // ─── Bouton « Quitter la page » sans perdre son texte ───
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // ─── Suivi « dirty » via le store (le texte ou ses métadonnées changent) ───
  useEffect(() => {
    const unsubscribe = useStudioStore.subscribe((next, previous) => {
      if (!loadFinishedRef.current) return;
      if (next.title !== previous.title || next.contentText !== previous.contentText || next.themeIds !== previous.themeIds || next.visibility !== previous.visibility || next.draftId !== previous.draftId) {
        dirtyRef.current = true;
      }
    });
    return unsubscribe;
  }, []);

  // ─── Sauvegarde sérialisée : au plus une requête active ; la dernière version gagne ───
  const runSave = useCallback(async (): Promise<string | null> => {
    if (savingRef.current) {
      pendingRef.current = true;
      return null;
    }
    savingRef.current = true;
    try {
      for (;;) {
        useStudioStore.setState({ saveStatus: "saving" });
        const snapshot = useStudioStore.getState();
        const author = userRef.current;
        if (!author) return null;
        try {
          const saved = await postsService.upsertDraft(buildDraftPayload(author, snapshot));
          useStudioStore.setState({ draftId: saved.id, saveStatus: "saved" });
          dirtyRef.current = false;
        } catch {
          useStudioStore.setState({ saveStatus: "error" });
          return null;
        }
        // Des modifications sont arrivées pendant la requête : on sauvegarde encore avec l'état le plus récent.
        if (pendingRef.current) {
          pendingRef.current = false;
          continue;
        }
        return useStudioStore.getState().draftId;
      }
    } finally {
      savingRef.current = false;
    }
  }, []);

  const saveNow: () => Promise<string | null> = () => runSave();

  // ─── Autosave déclenché après 1,5 s d'inactivité (uniquement une fois le brouillon prêt, jamais pendant une sauvegarde) ───
  useEffect(() => {
    if (!loadFinishedRef.current) return;
    if (!state.title && !state.contentText) return;
    const t = setTimeout(() => {
      void runSave();
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.title, state.contentText, state.themeIds, state.visibility]);

  // ─── Démontage : flush keepalive best-effort avant que le composant disparaisse ───
  useEffect(() => {
    return () => {
      if (!loadFinishedRef.current || !dirtyRef.current) return;
      const author = userRef.current;
      if (!author) return;
      const snapshot = useStudioStore.getState();
      const payload = buildDraftPayload(author, snapshot);
      // Keepalive survit au déchargement de la page (navigation client route Next ou fermeture).
      void fetch(apiUrl("/api/studio/drafts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // La route est la dernière ligne de défense ; si elle échoue, rien d'autre n'est faisable ici.
      });
    };
  }, []);

  const applyDoc = (doc: TiptapDoc) => {
    // Écriture autorisée uniquement lorsque le brouillon est chargé : le verrou est sur `editable` côté éditeur.
    state.setField("contentJson", doc);
    state.setField("contentText", extractPlainText(doc));
  };

  return { saveNow, applyDoc };
}
