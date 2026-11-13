"use client";

import type { PublishAs } from "@/types";

interface PublishAsRadioProps {
  value: PublishAs;
  onChange: (value: PublishAs) => void;
}

/**
 * Choix de signature « Publier sous » (Pseudonyme par défaut, ou nom réel).
 * @param props Option sélectionnée et callback de changement.
 */
export function PublishAsRadio({ value, onChange }: PublishAsRadioProps) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-medium text-encre">Publier sous</legend>
      <div className="flex flex-wrap gap-5 text-sm text-encre">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="publishAs" checked={value === "REAL_NAME"} onChange={() => onChange("REAL_NAME")} className="accent-encre-fort" />
          <span>Mon nom</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="publishAs" checked={value === "USERNAME"} onChange={() => onChange("USERNAME")} className="accent-encre-fort" />
          <span>Pseudonyme</span>
        </label>
      </div>
    </fieldset>
  );
}
