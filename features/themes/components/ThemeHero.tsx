import { formatCount } from "@/lib/format";
import type { ThemeItem } from "../types/themes.types";

/**
 * En-tête éditorial sobre et typographique de la page d'un thème (sans image).
 * @param props Thème affiché.
 */
export function ThemeHero({ theme }: { theme: ThemeItem }) {
  return (
    <section className="space-y-2 rounded-[24px] border-[1.5px] border-bord bg-jaune px-6 py-8 shadow-[4px_4px_0_0_var(--color-encre)] sm:px-8">
      <p className="inline-flex w-fit rounded-full border-[1.5px] border-encre bg-carte px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-encre">{theme.category}</p>
      <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-encre sm:text-6xl">
        {theme.name}
      </h1>
      <p className="text-lg font-medium italic text-encre/85">{theme.tagline}</p>
      <p className="pt-1 text-[13px] font-bold tabular-nums text-encre">
        {formatCount(theme.postCount)} publications · {theme.tagCount} tags
      </p>
    </section>
  );
}
