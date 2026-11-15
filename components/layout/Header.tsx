"use client";

import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useNotifications } from "@/features/notifications";
import { openAuthPopup } from "@/lib/open-auth";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "./UserMenu";
import { HangingPill } from "./sidebar-items";
import { HeaderSearch } from "./header-parts";

interface HeaderSection {
  href: string;
  label: string;
  bg: string;
}

const SECTIONS: HeaderSection[] = [
  { href: "/", label: "Le mur", bg: "#CFFB7F" },
  { href: "/themes", label: "Thèmes", bg: "#BDE0FE" },
  { href: "/auteurs", label: "Auteurs", bg: "#FFB4CF" },
  { href: "/parametres", label: "Paramètres", bg: "#EFE3CC" },
];

const LENGTHS = [12, 22, 16, 18];

/** Barre supérieure façon Trugly : full-bleed, recherche centrée, actions connectées à droite ; pastilles accrochées dessous (Le mur, Thèmes, Auteurs, Paramètres). */
export function Header() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30">
      {/* Barre principale — bord à bord */}
      <div className="flex h-12 items-center gap-2 border-b-2 border-encre bg-carte px-3 shadow-[0_2px_0_0_var(--color-ink-jar)] sm:h-14 sm:px-6">
        <HeaderSearch className="mx-auto w-[200px] max-w-sm sm:w-72 lg:w-80" />
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {user ? (
            <>
              <Link href="/studio" className="btn-jaune inline-flex !min-h-[36px] !px-3 !py-0 !text-[12px] sm:!min-h-[38px] sm:!px-4 sm:!text-[13px]"><Plus size={16} strokeWidth={2.5} aria-hidden="true" /><span className="hidden xs:inline">Écrire</span></Link>
              <Link href="/notifications" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-encre bg-ivoire text-encre shadow-[2px_2px_0_0_var(--color-ink-jar)] transition-colors hover:bg-pilule sm:h-10 sm:w-10">
                <Bell size={17} strokeWidth={2} aria-hidden="true" />
                {unreadCount > 0 ? <span className="badge-noir absolute -right-1 -top-1">{unreadCount}</span> : null}
              </Link>
              <UserMenu />
            </>
          ) : (
            <button type="button" onClick={openAuthPopup} className="btn-noir !min-h-[36px] !px-4 !py-0 !text-[12px] sm:!min-h-[38px] sm:!px-5 sm:!text-[13px]">Connexion</button>
          )}
          <MobileMenu />
        </div>
      </div>
      {/* Pastilles accrochées (visibles aussi sur mobile) */}
      <div className="flex items-start justify-start gap-4 overflow-x-auto border-b border-bord/40 px-3 pt-1 sm:justify-center sm:gap-6 sm:px-4">
        {SECTIONS.map((s, i) => (
          <HangingPill key={s.href} href={s.href} bg={s.bg} length={LENGTHS[i % LENGTHS.length]!}>{s.label}</HangingPill>
        ))}
      </div>
    </header>
  );
}
