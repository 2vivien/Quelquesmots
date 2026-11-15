"use client";

import { User } from "lucide-react";
import type { PublishAs } from "@/types";

interface PublishAsRadioProps {
  value: PublishAs;
  onChange: (value: PublishAs) => void;
}

/** Choix de signature « Publier sous » : tuiles épaisses (Pseudonyme = jaune / Mon nom = rose). */
export function PublishAsRadio({ value, onChange }: PublishAsRadioProps) {
  const options: Array<{ value: PublishAs; label: string; hint: string; bg: string; active: string }> = [
    { value: "USERNAME", label: "Pseudonyme", hint: "par défaut", bg: "#FFE37E", active: "#FFB4CF" },
    { value: "REAL_NAME", label: "Mon nom", hint: "nom complet", bg: "#FFB4CF", active: "#FFE37E" },
  ];

  return (
    <fieldset className="space-y-2">
      <legend className="text-[11px] font-black uppercase tracking-[0.2em] text-mute">Publier sous</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className="cursor-pointer select-none"
            >
              <input
                type="radio"
                name="publishAs"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span
                style={{ background: selected ? opt.active : opt.bg }}
                className={`flex min-h-[72px] items-center gap-3 rounded-[20px] border-[2.5px] border-encre p-3 text-left transition-all ${
                  selected
                    ? "shadow-[5px_5px_0_0_var(--color-ink-jar)] -translate-y-0.5"
                    : "hover:-translate-y-0.5"
                }`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[2px] border-encre bg-carte"
                  aria-hidden="true"
                >
                  <User size={18} strokeWidth={2.5} className="text-encre" />
                </span>
                <span className="flex flex-col">
                  <span className="font-display text-[15px] uppercase text-encre">{opt.label}</span>
                  <span className="text-[11px] font-semibold text-encre/70">{opt.hint}</span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
