"use client";

interface TitleFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Champ du titre en grande taille serif dans le Studio.
 * @param props Titre courant et callback de modification.
 */
export function TitleField({ value, onChange }: TitleFieldProps) {
  return (
    <input
      type="text"
      maxLength={120}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Titre de votre texte…"
      aria-label="Titre de votre texte"
      className="w-full border-none bg-transparent font-serif text-3xl text-encre placeholder:text-muted/60 focus:outline-none sm:text-4xl"
    />
  );
}
