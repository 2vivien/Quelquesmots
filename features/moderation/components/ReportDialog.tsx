"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { useReport } from "../hooks/useReport";
import type { ReportReason, ReportTargetType } from "../types/moderation.types";

/** Bouton discret ouvrant la fenêtre de signalement d'un contenu ou profil. */
export function ReportDialog(props: { targetType: ReportTargetType; targetId: string; targetLabel: string }) {
  const { submitReport } = useReport();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("OTHER");
  const [details, setDetails] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submitReport({ ...props, reason, details });
    if (ok) { setOpen(false); setDetails(""); }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Signaler" className="inline-flex min-h-[36px] items-center text-muted hover:text-encre">
        <Flag size={15} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-encre/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={(e) => void submit(e)} className="w-full max-w-md space-y-4 rounded-[16px] border border-bord bg-carte p-6">
            <h2 className="font-serif text-2xl text-encre">Signaler un contenu</h2>
            <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)} className="w-full rounded-[12px] border border-bord bg-pilule px-3 py-2 text-sm text-encre">
              <option value="SPAM">Spam ou publicité</option><option value="HARASSMENT">Harcèlement</option>
              <option value="HATE">Propos haineux</option><option value="DANGER">Danger pour la personne</option><option value="OTHER">Autre motif</option>
            </select>
            <textarea rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Précisions facultatives…" className="w-full rounded-[12px] border border-bord bg-pilule px-3 py-2 text-sm text-encre" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="min-h-[40px] rounded-full border border-bord px-4 text-sm">Annuler</button>
              <button type="submit" className="min-h-[40px] rounded-full bg-encre-fort px-5 text-sm text-ivoire">Envoyer</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
