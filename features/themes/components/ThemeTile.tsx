import Link from "next/link";
import { formatCount } from "@/lib/format";
import type { ThemeItem } from "../types/themes.types";

/**
 * Tuile éditoriale purement typographique d'un thème (sans image).
 * @param props Données du thème à afficher.
 */
export function ThemeTile({ theme }: { theme: ThemeItem }) {
  return (
    <Link
      href={`/themes/${theme.slug}`}
      className="group flex flex-col justify-between rounded-[14px] border border-bord bg-carte px-4 py-3.5 transition-colors hover:border-encre/40 hover:bg-pilule/40"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-serif text-lg text-encre group-hover:underline">
          {theme.name}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {formatCount(theme.postCount)}
        </span>
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-muted">{theme.tagline}</p>
    </Link>
  );
}
