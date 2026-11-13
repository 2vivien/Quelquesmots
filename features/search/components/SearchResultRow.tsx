import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Hash } from "lucide-react";
import type { SearchResultItem } from "../types/search.types";

interface SearchResultRowProps {
  item: SearchResultItem;
}

/**
 * Ligne de résultat unifiée (texte, thème, auteur ou tag).
 * @param props Élément de résultat à afficher.
 */
export function SearchResultRow({ item }: SearchResultRowProps) {
  const isRound = item.kind === "author";
  return (
    <Link
      href={item.href}
      className="group flex items-center justify-between gap-4 border-b border-bord py-3.5 transition-colors hover:bg-carte/70"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {item.imageUrl ? (
          <div className={`relative h-12 w-12 shrink-0 overflow-hidden bg-pilule ${isRound ? "rounded-full" : "rounded-[10px]"}`}>
            <Image src={item.imageUrl} alt={item.title} fill sizes="48px" referrerPolicy="no-referrer" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-pilule text-muted">
            <Hash size={18} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-encre group-hover:underline">{item.title}</p>
          <p className="truncate text-[13px] text-muted">{item.subtitle}</p>
        </div>
      </div>
      <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}
