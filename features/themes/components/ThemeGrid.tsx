import type { ThemeCategory, ThemeItem } from "../types/themes.types";
import { ThemeTile } from "./ThemeTile";

const CATEGORIES: ThemeCategory[] = [
  "Les émotions brutes et l'ombre",
  "L'amour, le corps et l'intimité",
  "L'esprit et la psychologie",
  "La reconstruction et la lumière",
  "La vie et le temps",
];

/**
 * Affiche les 55+ thèmes sans image regroupés par grande famille éditoriale.
 * @param props Liste des thèmes actifs filtrés.
 */
export function ThemeGrid({ themes }: { themes: ThemeItem[] }) {
  if (themes.length === 0) {
    return <p className="py-12 text-center font-serif italic text-muted">Rien ici pour l&apos;instant.</p>;
  }
  return (
    <div className="space-y-8">
      {CATEGORIES.map((category, idx) => {
        const group = themes.filter((t) => t.category === category);
        if (group.length === 0) return null;
        return (
          <section key={category} className="space-y-3">
            <h2 className="font-sans text-lg font-extrabold uppercase tracking-tight text-encre">
              <span className="mr-2 inline-block rounded-md border-[1.5px] border-bord bg-jaune px-2 py-0.5 text-xs align-middle">{idx + 1}</span>{category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((t) => <ThemeTile key={t.id} theme={t} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
