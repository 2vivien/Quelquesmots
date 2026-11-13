"use client";

import Link from "next/link";
import { HeaderMobile } from "./HeaderMobile";

/** En-tête éditorial centré sans barre de navigation textuelle. */
export function Header() {
  return (
    <header className="border-b border-bord bg-ivoire/95">
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex items-center justify-between md:hidden">
          <Link href="/" className="font-serif text-xl text-encre">Quelques mots</Link>
          <HeaderMobile />
        </div>
        <div className="mx-auto mt-4 max-w-2xl space-y-1.5 text-center md:mt-0">
          <Link href="/" className="hidden font-serif text-xs tracking-wide text-muted hover:text-encre md:inline-block">
            Quelques mots
          </Link>
          <h1 className="font-serif text-3xl font-normal text-encre sm:text-4xl">
            Un mur de mots.
          </h1>
          <p className="font-serif text-base italic text-encre/90 sm:text-lg">
            Des mots à écrire. Des histoires à lire. Des émotions à partager.
          </p>
          <p className="pt-1 text-xs leading-relaxed text-muted sm:text-sm">
            Un espace littéraire ouvert à tous, où chacun peut déposer quelques lignes, découvrir les pensées des autres et conserver les mots qui résonnent en lui.
          </p>
        </div>
      </div>
    </header>
  );
}
