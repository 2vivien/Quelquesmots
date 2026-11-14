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
    <div className="flex items-center gap-2">
      <Link
        href="/studio/brouillons"
        className={`rounded-full border-[1.5px] border-bord px-4 py-2 text-sm font-bold transition-all ${active === "drafts" ? "bg-jaune text-encre shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte text-muted hover:text-encre"}`}
      >
        Brouillons
      </Link>
      <Link
        href="/bibliotheque"
        className={`rounded-full border-[1.5px] border-bord px-4 py-2 text-sm font-bold transition-all ${active === "bookmarks" ? "bg-jaune text-encre shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte text-muted hover:text-encre"}`}
      >
        Bibliothèque
      </Link>
    </div>
  );
}
