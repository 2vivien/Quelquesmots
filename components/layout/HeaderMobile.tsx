"use client";

import Link from "next/link";
import { Bell, BookMarked, Hash, LogIn, Plus, Search, Users } from "lucide-react";
import { useAuth } from "@/features/auth";
import { openAuthPopup } from "@/lib/open-auth";
import { UserMenu } from "./UserMenu";

/** Barre d'icônes compacte sur mobile en haut à droite. */
export function HeaderMobile() {
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-1 md:hidden">
      <Link href="/recherche" aria-label="Rechercher" className="flex h-9 w-9 items-center justify-center rounded-full text-encre hover:bg-pilule"><Search size={17} strokeWidth={1.5} /></Link>
      <Link href="/themes" aria-label="Thèmes" className="flex h-9 w-9 items-center justify-center rounded-full text-encre hover:bg-pilule"><Hash size={17} strokeWidth={1.5} /></Link>
      <Link href="/auteurs" aria-label="Auteurs" className="flex h-9 w-9 items-center justify-center rounded-full text-encre hover:bg-pilule"><Users size={17} strokeWidth={1.5} /></Link>
      {user ? (
        <>
          <Link href="/studio" aria-label="Écrire" className="flex h-9 w-9 items-center justify-center rounded-full bg-encre-fort text-ivoire"><Plus size={17} strokeWidth={1.75} /></Link>
          <Link href="/bibliotheque" aria-label="Bibliothèque" className="flex h-9 w-9 items-center justify-center rounded-full text-encre hover:bg-pilule"><BookMarked size={17} strokeWidth={1.5} /></Link>
          <Link href="/notifications" aria-label="Notifications" className="flex h-9 w-9 items-center justify-center rounded-full text-encre hover:bg-pilule"><Bell size={17} strokeWidth={1.5} /></Link>
          <UserMenu />
        </>
      ) : (
        <button type="button" onClick={openAuthPopup} aria-label="Se connecter" className="flex h-9 w-9 items-center justify-center rounded-full bg-encre-fort text-ivoire"><LogIn size={16} strokeWidth={1.5} /></button>
      )}
    </div>
  );
}
