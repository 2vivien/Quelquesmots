"use client";

import type { Visibility } from "@/types";

interface VisibilitySelectProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
}

/**
 * Sélecteur de visibilité du texte dans le Studio (Tout le monde ou Privé).
 * @param props Visibilité choisie et callback de mise à jour.
 */
export function VisibilitySelect({ value, onChange }: VisibilitySelectProps) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted">
      <span>Visible par :</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Visibility)}
        className="rounded-full border border-bord bg-carte px-3 py-1 text-xs font-medium text-encre focus:border-encre focus:outline-none"
      >
        <option value="PUBLIC">Tout le monde</option>
        <option value="PRIVATE">Privé</option>
      </select>
    </label>
  );
}
