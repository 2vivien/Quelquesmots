import { formatCount } from "@/lib/format";
import type { ThemeItem } from "../types/themes.types";

/**
 * En-tête éditorial sobre et typographique de la page d'un thème (sans image).
 * @param props Thème affiché.
 */
export function ThemeHero({ theme }: { theme: ThemeItem }) {
  return (
    <section className="space-y-2 border-b border-bord pb-6">
      <p className="text-xs text-muted">{theme.category}</p>
      <h1 className="font-serif text-4xl font-normal text-encre sm:text-5xl">
        {theme.name}
      </h1>
      <p className="font-serif text-lg italic text-encre/85">{theme.tagline}</p>
      <p className="pt-1 text-[13px] tabular-nums text-muted">
        {formatCount(theme.postCount)} publications · {theme.tagCount} tags
      </p>
    </section>
  );
}
