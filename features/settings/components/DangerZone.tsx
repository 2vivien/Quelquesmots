"use client";

import { useState } from "react";
import { Flame, LogOut, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DangerZoneProps {
  onSignOut: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

/** Zone rouge — déconnexion et suppression définitive du compte. */
export function DangerZone({ onSignOut, onDelete }: DangerZoneProps) {
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loading, setLoading] = useState<"signout" | "delete" | null>(null);

  const handleSignOut = async () => {
    setLoading("signout");
    try {
      await onSignOut();
    } finally {
      setLoading(null);
      setConfirmingSignOut(false);
    }
  };

  const handleDelete = async () => {
    setLoading("delete");
    try {
      await onDelete();
    } finally {
      setLoading(null);
      setConfirmingDelete(false);
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-[28px] border-[3px] border-encre bg-[#FAF2EA] shadow-[8px_8px_0_0_var(--color-ink-jar)]">
        <div className="flex items-center gap-3 border-b-[3px] border-encre bg-corail px-6 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] border-encre bg-carte">
            <Flame size={18} strokeWidth={2.25} aria-hidden="true" className="text-encre" />
          </span>
          <h2 className="font-display text-[17px] uppercase leading-none tracking-wide text-encre">Zone rouge</h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="max-w-[40ch] text-[13px] leading-snug text-encre/85">
            Déconnexion immédiate ou suppression définitive du compte avec un délai de 14 jours.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setConfirmingSignOut(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full border-[2px] border-encre bg-carte px-5 text-sm font-extrabold text-encre shadow-[3px_3px_0_0_var(--color-ink-jar)] transition hover:-translate-y-0.5 hover:bg-pilule"
            >
              <LogOut size={15} strokeWidth={2.5} aria-hidden="true" />
              Se déconnecter
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-full border-[2px] border-encre bg-[#FF8A7A] px-5 text-sm font-extrabold text-encre shadow-[3px_3px_0_0_var(--color-ink-jar)] transition hover:-translate-y-0.5"
            >
              <Trash2 size={15} strokeWidth={2.5} aria-hidden="true" />
              Supprimer le compte
            </button>
          </div>
        </div>
      </section>
      <ConfirmDialog
        open={confirmingSignOut}
        title="Se déconnecter ?"
        message="Tu vas quitter ton compte. Tu pourras te reconnecter à tout moment avec Google."
        confirmLabel="Se déconnecter"
        loading={loading === "signout"}
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmingSignOut(false)}
      />
      <ConfirmDialog
        open={confirmingDelete}
        title="Supprimer le compte ?"
        message="Ton compte et tes textes publiés seront masqués immédiatement. La suppression définitive intervient sous 14 jours. Cette action est irréversible une fois le délai écoulé."
        confirmLabel="Supprimer définitivement"
        destructive
        loading={loading === "delete"}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
