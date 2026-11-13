"use client";

import type { ReportItem } from "@/features/moderation";

interface ReportTableProps {
  reports: ReportItem[];
  onAction: (input: { reportId: string; targetId: string; targetLabel: string; action: "HIDE" | "RESTORE" | "DISMISS" }) => void;
}

/**
 * File des signalements avec actions de modération (Masquer, Rétablir, Ignorer).
 * @param props Liste des signalements et gestionnaire d'action.
 */
export function ReportTable({ reports, onAction }: ReportTableProps) {
  if (reports.length === 0) {
    return <p className="py-6 font-serif italic text-muted">Aucun signalement en attente.</p>;
  }
  return (
    <div className="divide-y divide-bord rounded-[16px] border border-bord bg-carte px-5">
      {reports.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="space-y-1">
            <p className="font-medium text-encre">
              {r.targetLabel} <span className="text-xs text-muted">({r.reason} · {r.status})</span>
            </p>
            <p className="text-xs text-muted">{r.details || "Aucune précision"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onAction({ reportId: r.id, targetId: r.targetId, targetLabel: r.targetLabel, action: "HIDE" })} className="rounded-full bg-encre-fort px-3 py-1 text-xs text-ivoire">Masquer</button>
            <button type="button" onClick={() => onAction({ reportId: r.id, targetId: r.targetId, targetLabel: r.targetLabel, action: "RESTORE" })} className="rounded-full border border-bord px-3 py-1 text-xs text-encre">Rétablir</button>
            <button type="button" onClick={() => onAction({ reportId: r.id, targetId: r.targetId, targetLabel: r.targetLabel, action: "DISMISS" })} className="rounded-full border border-bord px-3 py-1 text-xs text-muted">Ignorer</button>
          </div>
        </div>
      ))}
    </div>
  );
}
