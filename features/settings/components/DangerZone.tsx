"use client";

import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DangerZoneProps {
  onSignOut: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}

/**
 * Zone compte : déconnexion et suppression définitive du compte (délai 14 jours).
 * Les deux actions exigent une confirmation via une fenêtre modale brutaliste.
 */
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
      <section className="space-y-4 rounded-[16px] border-[1.5px] border-bord bg-carte p-6 shadow-[3px_3px_0_0_var(--color-encre)]">
        <h2 className="font-serif text-xl font-extrabold text-encre">Données et compte</h2>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setConfirmingSignOut(true)} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border-[1.5px] border-bord bg-carte px-4 text-sm font-semibold text-encre transition-colors hover:bg-pilule">
            <LogOut size={15} strokeWidth={2} aria-hidden="true" />
            Se déconnecter
          </button>
          <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border-[1.5px] border-bord bg-carte px-4 text-sm font-semibold text-muted transition-colors hover:border-encre hover:text-encre">
            <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
            Supprimer mon compte
          </button>
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
