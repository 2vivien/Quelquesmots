"use client";

/** Tuile épaisse à cocher — inspirée des pastilles de l'app. */
export function ToggleTile({
  checked,
  onChange,
  label,
  active,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  active: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3 rounded-[20px] border-[2.5px] border-encre px-4 py-3 text-[13px] font-bold text-encre transition-all hover:-translate-y-0.5" style={{ background: checked ? active : "#FFF8ED", boxShadow: checked ? "4px 4px 0 0 var(--color-ink-jar)" : "none" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[2.5px] border-encre ${checked ? "bg-encre" : "bg-carte"}`} aria-hidden="true">
        {checked ? <span className="h-2.5 w-2.5 rounded-full bg-jaune" /> : null}
      </span>
      <span className="flex-1">{label}</span>
    </label>
  );
}
