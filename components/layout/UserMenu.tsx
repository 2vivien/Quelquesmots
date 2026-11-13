"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthorAvatar } from "@/features/authors";
import { useAuth } from "@/features/auth";

/**
 * Menu déroulant de l'utilisateur connecté (thèmes, auteurs, bibliothèque, paramètres, déconnexion).
 */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Menu utilisateur" className="flex items-center rounded-full p-0.5">
        <AuthorAvatar src={user.avatarUrl} alt={user.username} size={36} ring />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-40 w-56 rounded-[16px] border border-bord bg-carte py-2 shadow-sm">
          <Link href="/themes" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-encre hover:bg-pilule">Voir tous les thèmes</Link>
          <Link href="/auteurs" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-encre hover:bg-pilule">Voir tous les auteurs</Link>
          <Link href="/studio/brouillons" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-encre hover:bg-pilule">Brouillons &amp; bibliothèque</Link>
          <Link href="/parametres" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-encre hover:bg-pilule">Paramètres</Link>
          {user.role === "admin" || user.role === "moderator" ? (
            <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-encre hover:bg-pilule">Modération</Link>
          ) : null}
          <button type="button" onClick={() => { setOpen(false); void signOut(); }} className="mt-1 block w-full border-t border-bord px-4 pt-2.5 pb-1.5 text-left text-sm text-muted hover:text-encre">
            Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  );
}
