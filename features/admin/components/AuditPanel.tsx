import { RelativeTime } from "@/components/ui/RelativeTime";
import type { AuditEntry } from "../types/admin.types";

interface AuditPanelProps {
  entries: AuditEntry[];
}

/**
 * Journal d'audit listant les dernières actions de modération.
 * @param props Entrées d'audit chronologiques.
 */
export function AuditPanel({ entries }: AuditPanelProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl text-encre">Journal d&apos;audit</h2>
      {entries.length === 0 ? (
        <p className="font-serif italic text-muted">Aucune action enregistrée.</p>
      ) : (
        <div className="divide-y divide-bord rounded-[16px] border border-bord bg-carte px-5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="text-encre">
                <strong>{entry.actorUsername}</strong> · {entry.action} — {entry.targetLabel}
              </span>
              <span className="text-xs text-muted"><RelativeTime isoDate={entry.createdAt} /></span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
