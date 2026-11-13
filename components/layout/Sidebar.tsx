"use client";

import Link from "next/link";
import {
  Bell,
  BookMarked,
  Hash,
  Home,
  LogIn,
  PenLine,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth";
import { useNotifications } from "@/features/notifications";
import { openAuthPopup } from "@/lib/open-auth";
import { UserMenu } from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
  badge?: number;
}

function NavRow({ href, label, Icon, active, badge }: NavItem) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[15px] transition-colors ${
        active ? "bg-pilule font-bold text-encre" : "font-medium text-muted hover:bg-pilule/60 hover:text-encre"
      }`}
    >
      <Icon size={19} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {badge ? <span className="badge-noir">{badge}</span> : null}
    </Link>
  );
}

/** Barre latérale de navigation fixée à gauche sur grand écran (style Otheloo). */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const is = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false);

  return (
    <aside aria-label="Navigation principale" className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col gap-4 border-r border-bord bg-ivoire px-4 py-5 lg:flex">
      <Link href="/" className="px-2 py-1 font-display text-lg uppercase leading-none tracking-tight text-encre">
        Quelques mots
      </Link>
      <Link href="/studio" className="btn-jaune w-full">
        <PenLine size={18} strokeWidth={2} aria-hidden="true" />
        Écrire
      </Link>
      <nav className="flex flex-col gap-1" aria-label="Sections">
        <NavRow href="/" label="Le mur" Icon={Home} active={is("/")} />
        <NavRow href="/recherche" label="Recherche" Icon={Search} active={is("/recherche")} />
        <NavRow href="/themes" label="Thèmes" Icon={Hash} active={is("/themes")} />
        <NavRow href="/auteurs" label="Auteurs" Icon={Users} active={is("/auteurs")} />
      </nav>
      <nav className="flex flex-col gap-1" aria-label="Mon compte">
        {user ? (
          <>
            <NavRow href="/studio/brouillons" label="Brouillons" Icon={PenLine} active={is("/studio/brouillons")} />
            <NavRow href="/notifications" label="Notifications" Icon={Bell} active={is("/notifications")} badge={unreadCount} />
            <NavRow href="/bibliotheque" label="Bibliothèque" Icon={BookMarked} active={is("/bibliotheque")} />
            <NavRow href="/parametres" label="Paramètres" Icon={Settings} active={is("/parametres")} />
            {user.role === "admin" ? <NavRow href="/admin" label="Modération" Icon={Shield} active={is("/admin")} /> : null}
          </>
        ) : (
          <button type="button" onClick={openAuthPopup} className="flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[15px] font-medium text-muted transition-colors hover:bg-pilule hover:text-encre">
            <LogIn size={19} strokeWidth={1.75} aria-hidden="true" />
            <span>Se connecter</span>
          </button>
        )}
      </nav>
      <div className="mt-auto space-y-3">
        {user ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-carte p-2.5 shadow-sm ring-1 ring-bord">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-encre">{user.firstName || "Moi"}</p>
              <p className="truncate text-[11px] text-muted">@{user.username}</p>
            </div>
            <UserMenu />
          </div>
        ) : null}
        <nav className="flex flex-col gap-1.5 px-1.5 text-[11px] text-muted" aria-label="Liens de pied">
          <div className="flex gap-x-3"><Link href="/a-propos" className="hover:text-encre">À propos</Link><Link href="/aide" className="hover:text-encre">Aide</Link></div>
          <div className="flex gap-x-3"><Link href="/conditions" className="hover:text-encre">Conditions</Link><Link href="/confidentialite" className="hover:text-encre">Confidentialité</Link></div>
        </nav>
      </div>
    </aside>
  );
}
