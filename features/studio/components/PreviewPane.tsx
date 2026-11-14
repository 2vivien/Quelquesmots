"use client";

import { ReaderBody } from "@/features/reader";
import type { TiptapDoc } from "@/types";

interface PreviewPaneProps {
  title: string;
  contentJson: TiptapDoc;
  tags: string[];
}

/**
 * Aperçu fidèle au rendu final de la page de lecture (`/mots/[id]`).
 * @param props Titre, document Tiptap et tags choisis.
 */
export function PreviewPane({ title, contentJson, tags }: PreviewPaneProps) {
  return (
    <article className="mx-auto max-w-[680px] space-y-6 rounded-[20px] border-[1.5px] border-bord bg-carte p-8 shadow-[3px_3px_0_0_var(--color-encre)]">
      <h1 className="font-serif text-3xl leading-[1.15] text-encre sm:text-4xl">
        {title.trim() || "Sans titre"}
      </h1>
      <ReaderBody doc={contentJson} />
      {tags.length > 0 ? (
        <p className="text-[13px] text-muted">{tags.map((t) => `#${t}`).join(" ")}</p>
      ) : null}
    </article>
  );
}
