"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

interface DangerZoneProps {
  onSignOut: () => void;
  onDelete: () => void;
}

/**
 * Zone compte : déconnexion et suppression définitive du compte (délai 14 jours).
 * @param props Action de déconnexion et action de suppression.
 */
export function DangerZone({ onSignOut, onDelete }: DangerZoneProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="space-y-4 rounded-[16px] border border-bord bg-carte p-6">
      <h2 className="font-serif text-xl text-encre">Données et compte</h2>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onSignOut} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-bord px-4 text-sm text-encre hover:bg-pilule">
          <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
          Se déconnecter
        </button>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="min-h-[40px] rounded-full border border-bord px-4 text-sm text-muted hover:text-encre">
            Supprimer mon compte
          </button>
        ) : (
          <button type="button" onClick={onDelete} className="min-h-[40px] rounded-full bg-encre-fort px-4 text-sm text-ivoire">
            Confirmer la suppression (J+14)
          </button>
        )}
      </div>
    </section>
  );
}
