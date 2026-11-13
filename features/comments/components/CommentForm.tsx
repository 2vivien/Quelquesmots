"use client";

import { useState } from "react";

interface CommentFormProps {
  replyToId: string | null;
  onCancelReply: () => void;
  onSubmit: (body: string) => void;
  disabled: boolean;
}

/**
 * Formulaire d'ajout de commentaire (2 à 500 caractères).
 * @param props État de réponse, soumission et désactivation.
 */
export function CommentForm({ replyToId, onCancelReply, onSubmit, disabled }: CommentFormProps) {
  const [body, setBody] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length < 2) return;
    onSubmit(body.trim());
    setBody("");
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
        maxLength={500}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Écrire un commentaire bienveillant…"
        className="w-full rounded-[16px] border border-bord bg-pilule px-4 py-3 text-[15px] text-encre placeholder:text-muted focus:border-encre focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs tabular-nums text-muted">{body.length} / 500</span>
        <button type="submit" disabled={disabled || body.trim().length < 2} className="min-h-[40px] rounded-full bg-encre-fort px-5 py-1.5 text-sm text-ivoire disabled:opacity-50">
          Commenter
        </button>
      </div>
    </form>
  );
}
