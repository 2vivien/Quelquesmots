import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatCount } from "@/lib/format";
import type { ThemeItem } from "../types/themes.types";

/**
 * Ligne compacte purement typographique d'un thème (mobile et listes).
 * @param props Données du thème à afficher.
 */
export function ThemeRow({ theme }: { theme: ThemeItem }) {
  return (
    <Link
      href={`/themes/${theme.id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-bord bg-carte px-4 py-3.5 shadow-[2px_2px_0_0_var(--color-encre)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-encre)]"
    >
      <div className="min-w-0">
        <p className="truncate font-serif text-lg text-encre group-hover:underline">
          {theme.name}
        </p>
        <p className="truncate text-[13px] text-muted">
          {formatCount(theme.postCount)} textes · {theme.tagline}
        </p>
      </div>
      <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}
