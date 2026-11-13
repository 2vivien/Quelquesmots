"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Quote } from "lucide-react";
import { useEffect } from "react";
import type { TiptapDoc } from "@/types";
import { STUDIO_LIMITS } from "../schemas/publish.schema";

/** Surface d'écriture Tiptap avec barre discrète et limite à 1 500 caractères. */
export function EditorSurface({ content, onUpdate }: { content: TiptapDoc; onUpdate: (doc: TiptapDoc) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, bulletList: false, orderedList: false }),
      Placeholder.configure({ placeholder: "Commencez à écrire…" }),
      CharacterCount.configure({ limit: STUDIO_LIMITS.BODY_MAX }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => onUpdate(ed.getJSON() as TiptapDoc),
    editorProps: { attributes: { class: "tiptap min-h-[260px] font-serif text-[19px] leading-[1.7] text-encre focus:outline-none" } },
  });

  useEffect(() => {
    if (editor && editor.isEmpty && content.content.length > 0 && content.content[0]?.content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) return <div className="min-h-[260px] animate-pulse rounded-[16px] bg-pilule/40" />;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 border-b border-bord pb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Gras" className={`rounded-md p-2 ${editor.isActive("bold") ? "bg-pilule text-encre" : "text-muted hover:text-encre"}`}><Bold size={16} strokeWidth={1.5} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italique" className={`rounded-md p-2 ${editor.isActive("italic") ? "bg-pilule text-encre" : "text-muted hover:text-encre"}`}><Italic size={16} strokeWidth={1.5} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Citation" className={`rounded-md p-2 ${editor.isActive("blockquote") ? "bg-pilule text-encre" : "text-muted hover:text-encre"}`}><Quote size={16} strokeWidth={1.5} /></button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
