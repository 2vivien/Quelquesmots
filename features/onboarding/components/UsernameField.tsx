"use client";

interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
  available: boolean | null;
}

/**
 * Champ de saisie du pseudonyme avec indicateur de disponibilité en direct.
 * @param props Valeur courante, callback et statut de disponibilité.
 */
export function UsernameField({
  value,
  onChange,
  available,
}: UsernameFieldProps) {
  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor="onb-username" className="block text-sm font-medium text-encre">
        Pseudonyme
      </label>
      <input
        id="onb-username"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="plume.libre"
        className="w-full rounded-full border border-bord bg-pilule px-4 py-2.5 text-sm text-encre placeholder:text-muted focus:border-encre focus:outline-none"
      />
      {available !== null ? (
        <p className="text-xs text-muted">
          {available ? "Ce pseudonyme est disponible." : "Ce pseudonyme est déjà pris."}
        </p>
      ) : null}
    </div>
  );
}
