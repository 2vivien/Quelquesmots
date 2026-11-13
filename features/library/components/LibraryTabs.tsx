"use client";

import Link from "next/link";

interface LibraryTabsProps {
  active: "drafts" | "bookmarks";
}

/**
 * Onglets Brouillons · Bibliothèque de l'écran 9.
 * @param props Onglet actif.
 */
export function LibraryTabs({ active }: LibraryTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-bord">
      <Link
        href="/studio/brouillons"
        className={`border-b-2 pb-2.5 text-sm ${active === "drafts" ? "border-encre font-medium text-encre" : "border-transparent text-muted hover:text-encre"}`}
      >
        Brouillons
      </Link>
      <Link
        href="/bibliotheque"
        className={`border-b-2 pb-2.5 text-sm ${active === "bookmarks" ? "border-encre font-medium text-encre" : "border-transparent text-muted hover:text-encre"}`}
      >
        Bibliothèque
      </Link>
    </div>
  );
}
