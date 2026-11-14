"use client";

import Link from "next/link";
import {
  BookMarked,
  Hash,
  Home,
  PenLine,
  Settings,
  Shield,
} from "lucide-react";
import { IconUserSquare } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth";
import { UserMenu } from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}

function NavRow({ href, label, Icon, active }: NavItem) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 items-center gap-3 rounded-2xl border-[1.5px] border-bord px-3.5 text-[15px] font-semibold transition-all duration-150 ${
        active
          ? "bg-jaune text-encre shadow-[2px_2px_0_0_var(--color-encre)]"
          : "bg-carte text-encre hover:-translate-y-0.5 hover:bg-pilule hover:shadow-[2px_2px_0_0_var(--color-encre)]"
      }`}
    >
      <Icon size={19} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

/** Barre latérale de navigation (néo-brutalisme) : logo, Écrire et sections du site. */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const is = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false);

  return (
    <aside aria-label="Navigation principale" className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col gap-4 border-r-[1.5px] border-bord bg-ivoire px-4 py-5 lg:flex">
      <Link href="/" className="px-2 py-1 font-display text-lg uppercase leading-none tracking-tight text-encre">
        Quelques mots
      </Link>
      <Link href="/studio" className="btn-jaune w-full">
        <PenLine size={18} strokeWidth={2.25} aria-hidden="true" />
        Écrire
      </Link>
      <nav className="flex flex-col gap-2" aria-label="Sections">
        <NavRow href="/" label="Le mur" Icon={Home} active={is("/")} />
        <NavRow href="/themes" label="Thèmes" Icon={Hash} active={is("/themes")} />
        <NavRow href="/auteurs" label="Auteurs" Icon={IconUserSquare} active={is("/auteurs")} />
      </nav>
      {user ? (
        <nav className="flex flex-col gap-2" aria-label="Mon compte">
          <NavRow href="/studio/brouillons" label="Brouillons" Icon={PenLine} active={is("/studio/brouillons")} />
          <NavRow href="/bibliotheque" label="Bibliothèque" Icon={BookMarked} active={is("/bibliotheque")} />
          <NavRow href="/parametres" label="Paramètres" Icon={Settings} active={is("/parametres")} />
          {user.role === "admin" ? <NavRow href="/admin" label="Modération" Icon={Shield} active={is("/admin")} /> : null}
        </nav>
      ) : null}
      <div className="mt-auto space-y-3">
        {user ? (
          <div className="flex items-center justify-between gap-2 rounded-2xl border-[1.5px] border-bord bg-carte p-2.5 shadow-[2px_2px_0_0_var(--color-encre)]">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-extrabold leading-tight text-encre">{user.firstName || "Moi"}</p>
              <p className="truncate text-[11px] text-muted">@{user.username}</p>
            </div>
            <UserMenu />
          </div>
        ) : null}
        <nav className="flex flex-col gap-1 px-1.5 text-[11px] font-semibold text-muted" aria-label="Liens de pied">
          <div className="flex gap-x-3"><Link href="/a-propos" className="hover:text-encre">À propos</Link><Link href="/aide" className="hover:text-encre">Aide</Link></div>
          <div className="flex gap-x-3"><Link href="/conditions" className="hover:text-encre">Conditions</Link><Link href="/confidentialite" className="hover:text-encre">Confidentialité</Link></div>
        </nav>
      </div>
    </aside>
  );
}
