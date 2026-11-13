"use client";

import Link from "next/link";
import { Bell, BookMarked, Hash, Home, LogIn, Plus, Search, Settings, Shield, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth";
import { useNotifications } from "@/features/notifications";

const PUBLIC_ICONS = [
  { href: "/", label: "Le mur", Icon: Home },
  { href: "/recherche", label: "Rechercher", Icon: Search },
  { href: "/themes", label: "Thèmes", Icon: Hash },
  { href: "/auteurs", label: "Auteurs", Icon: Users },
] as const;

/** Barre verticale d'icônes fixée le long du bord droit sur ordinateur. */
export function RightIconRail() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const cls = (active: boolean) => `relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${active ? "bg-encre-fort text-ivoire" : "text-muted hover:bg-pilule hover:text-encre"}`;

  return (
    <aside aria-label="Navigation principale" className="fixed bottom-0 right-0 top-0 z-40 hidden w-14 flex-col items-center justify-center gap-2.5 border-l border-bord bg-carte/95 py-4 md:flex">
      {PUBLIC_ICONS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} title={label} aria-label={label} className={cls(href === "/" ? pathname === "/" : pathname.startsWith(href))}>
          <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      ))}
      <span className="my-1 h-px w-6 bg-bord" aria-hidden="true" />
      {user ? (
        <>
          <Link href="/studio" title="Écrire" aria-label="Écrire un texte" className="flex h-9 w-9 items-center justify-center rounded-full bg-encre-fort text-ivoire hover:opacity-90"><Plus size={18} strokeWidth={1.75} /></Link>
          <Link href="/notifications" title="Notifications" aria-label="Notifications" className={cls(pathname.startsWith("/notifications"))}>
            <Bell size={18} strokeWidth={1.5} />
            {unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-encre-fort px-1 text-[10px] text-ivoire">{unreadCount}</span> : null}
          </Link>
          <Link href="/bibliotheque" title="Bibliothèque & brouillons" aria-label="Bibliothèque" className={cls(pathname.startsWith("/bibliotheque") || pathname.startsWith("/studio/brouillons"))}><BookMarked size={18} strokeWidth={1.5} /></Link>
          <Link href="/parametres" title="Paramètres" aria-label="Paramètres" className={cls(pathname.startsWith("/parametres"))}><Settings size={18} strokeWidth={1.5} /></Link>
          {user.role === "admin" || user.role === "moderator" ? <Link href="/admin" title="Modération" aria-label="Modération" className={cls(pathname.startsWith("/admin"))}><Shield size={18} strokeWidth={1.5} /></Link> : null}
        </>
      ) : (
        <Link href="/connexion" title="Se connecter" aria-label="Se connecter" className={cls(pathname.startsWith("/connexion"))}><LogIn size={18} strokeWidth={1.5} /></Link>
      )}
    </aside>
  );
}
