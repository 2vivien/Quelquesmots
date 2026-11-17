"use client";

import { create } from "zustand";
import type { TiptapDoc, Visibility } from "@/types";


interface StudioState extends StudioFields {
  setField: <K extends keyof StudioFields>(key: K, value: StudioFields[K]) => void;
  reset: (initial?: Partial<StudioFields> & { draftId?: string | null }) => void;
}

export interface StudioFields {
  draftId: string | null;
  title: string;
  contentJson: TiptapDoc;
  contentText: string;
  themeIds: string[];
  visibility: Visibility;
  previewOpen: boolean;
  publishOpen: boolean;
  saveStatus: SaveStatus;
  loadStatus: LoadStatus;
}

export type LoadStatus = "idle" | "loading" | "ready";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

const EMPTY_DOC: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };

/** Store Zustand de l'état d'interface et du brouillon actif du Studio. */
export const useStudioStore = create<StudioState>((set) => ({
  draftId: null,
  title: "",
  contentJson: EMPTY_DOC,
  contentText: "",
  themeIds: [],
  visibility: "PUBLIC",
  previewOpen: false,
  publishOpen: false,
  saveStatus: "idle",
  loadStatus: "ready",
  setField: (key, value) => set({ [key]: value }),
  reset: (initial) =>
    set({
      draftId: initial?.draftId ?? null,
      title: initial?.title ?? "",
      contentJson: initial?.contentJson ?? EMPTY_DOC,
      contentText: initial?.contentText ?? "",
      themeIds: initial?.themeIds ?? [],
      visibility: initial?.visibility ?? "PUBLIC",
      previewOpen: false,
      publishOpen: false,
      saveStatus: "idle",
      loadStatus: "ready",
    }),
}));
