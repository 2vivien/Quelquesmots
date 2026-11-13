"use client";

import { useState } from "react";

interface DangerZoneProps {
  onExport: () => void;
  onDelete: () => void;
}

/**
 * Zone d'export des données JSON et de suppression de compte (délai 14 jours).
 * @param props Actions d'export et de suppression.
 */
export function DangerZone({ onExport, onDelete }: DangerZoneProps) {
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="space-y-4 rounded-[16px] border border-bord bg-carte p-6">
      <h2 className="font-serif text-xl text-encre">Données et compte</h2>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onExport} className="min-h-[40px] rounded-full border border-bord px-4 text-sm text-encre hover:bg-pilule">
          Exporter mes données (JSON)
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
