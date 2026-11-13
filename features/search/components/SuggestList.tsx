"use client";

import Link from "next/link";
import type { SearchResultItem } from "../types/search.types";

interface SuggestListProps {
  items: SearchResultItem[];
  onPick: () => void;
}

/**
 * Menu déroulant de suggestions instantanées (5 résultats max).
 * @param props Suggestions renvoyées par la recherche et callback de fermeture.
 */
export function SuggestList({ items, onPick }: SuggestListProps) {
  if (items.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-[16px] border border-bord bg-carte shadow-sm">
      {items.map((item) => (
        <Link
          key={`${item.kind}-${item.id}`}
          href={item.href}
          onClick={onPick}
          className="block border-b border-bord px-4 py-2.5 last:border-none hover:bg-pilule/60"
        >
          <p className="truncate text-sm font-medium text-encre">{item.title}</p>
          <p className="truncate text-xs text-muted">{item.subtitle}</p>
        </Link>
      ))}
    </div>
  );
}
