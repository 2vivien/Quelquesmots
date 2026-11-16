"use client";

import Link from "next/link";
import Image from "next/image";
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
];

const LENGTHS = [14, 22, 18];

/** Barre supérieure façon Trugly : full-bleed, recherche centrée, actions connectées à droite ; pastilles accrochées dessous (Le mur, Thèmes, Auteurs — toujours accessibles). */
export function Header() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30">
      {/* Barre principale — bord à bord */}
      <div className="relative flex h-12 items-center border-b-2 border-encre bg-carte px-3 shadow-[0_2px_0_0_var(--color-ink-jar)] sm:h-14 sm:px-6">
        {/* Logo + nom (mobile uniquement — le desktop a la sidebar) */}
        <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="Accueil — Quelques mots">
          <Image
            src="/images/editorial/plume.png"
            alt="Plume Quelques mots"
            width={44}
            height={77}
            className="h-10 w-auto select-none drop-shadow-[1px_1px_0_var(--color-ink-jar)]"
            priority
          />
          <span className="whitespace-nowrap font-display text-[17px] uppercase tracking-tight text-encre">
            Quelques mots
          </span>
        </Link>
        <HeaderSearch className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:w-[32rem] xl:w-[36rem]" />
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Actions complètes uniquement sur desktop — sur mobile : hamburger seul (tout passe par le tiroir) */}
          <div className="hidden items-center gap-1.5 lg:flex sm:gap-2">
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
          </div>
          <MobileMenu />
        </div>
      </div>
      {/* Pastilles accrochées (visibles aussi sur mobile) */}
      <div className="no-scrollbar flex items-start justify-start gap-3 overflow-x-auto border-b border-bord/40 px-3 pt-1 sm:justify-center sm:gap-6 sm:px-4">
        {SECTIONS.map((s, i) => (
          <HangingPill key={s.href} href={s.href} bg={s.bg} length={LENGTHS[i % LENGTHS.length]!}>{s.label}</HangingPill>
        ))}
      </div>
    </header>
  );
}
