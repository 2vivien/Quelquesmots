"use client";

import { useState } from "react";
import { countGraphemes } from "@/lib/sanitize";

interface CommentFormProps {
  replyToId: string | null;
  onCancelReply: () => void;
  onSubmit: (body: string) => Promise<boolean> | boolean;
  disabled: boolean;
}

const LIMIT = 500;
const MIN = 2;

/**
 * Formulaire d'ajout de commentaire (2 à 500 graphèmes).
 * Le texte n'est effacé qu'après confirmation serveur ; en cas d'erreur il est conservé.
 */
export function CommentForm({ replyToId, onCancelReply, onSubmit, disabled }: CommentFormProps) {
  const [body, setBody] = useState("");
  const length = countGraphemes(body);
  const canSubmit = length >= MIN && length <= LIMIT && !disabled;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (countGraphemes(trimmed) < MIN) return;
    const ok = await onSubmit(trimmed);
    if (ok) setBody("");
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      {replyToId ? (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Réponse à un commentaire</span>
          <button type="button" onClick={onCancelReply} className="underline">Annuler</button>
        </div>
      ) : null}
      <textarea
        rows={3}
        maxLength={550}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Écrire un commentaire bienveillant…"
        className="w-full rounded-[16px] border border-bord bg-pilule px-4 py-3 text-[15px] text-encre placeholder:text-muted focus:border-encre focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums text-muted">{length} / {LIMIT}</span>
        <button type="submit" disabled={!canSubmit} className="min-h-[40px] rounded-full bg-encre-fort px-5 py-1.5 text-sm text-ivoire disabled:opacity-50">
          Commenter
        </button>
      </div>
    </form>
  );
}