"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { IconUserSquare } from "@tabler/icons-react";
import { UserMenu } from "./UserMenu";

export type IconComponent = typeof Home;

export interface NavItemProps {
  href: string;
  label: string;
  Icon: IconComponent | typeof IconUserSquare;
  bg: string;
  active: boolean;
}

/** Pastille de navigation néo-brutalisme façon Trugly : icône en tuile colorée + libellé. */
export function NavRow({ href, label, Icon, bg, active }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      style={{ background: active ? bg : undefined }}
      className={`flex h-12 items-center gap-3 rounded-2xl border-2 border-encre px-2 pr-3 text-[15px] font-extrabold text-encre transition-all duration-150 ${
        active
          ? "shadow-[3px_3px_0_0_var(--color-ink-jar)]"
          : "bg-carte shadow-[2px_2px_0_0_var(--color-ink-jar)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink-jar)]"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-encre" style={{ background: bg }}>
        <Icon size={17} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}

/** Petit bouton accroché sous la barre principale, avec fil en pointillés. */
export function HangingPill({ href, bg, length, children }: { href: string; bg: string; length: number; children: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center" aria-label={children}>
      <span aria-hidden="true" className="block w-0 border-l-2 border-dotted border-encre" style={{ height: length }} />
      <span
        style={{ background: bg }}
        className="swing rounded-full border-2 border-encre px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-encre shadow-[2px_2px_0_0_var(--color-ink-jar)] transition-transform group-hover:-translate-y-1"
      >
        {children}
      </span>
    </Link>
  );
}

/** Carte utilisateur + liens de pied de la sidebar. */
export function SidebarFooter({ user }: { user: { firstName: string; username: string } | null }) {
  return (
    <div className="mt-auto space-y-2">
      {user ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-encre bg-carte p-2.5 shadow-[3px_3px_0_0_var(--color-ink-jar)]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold leading-tight text-encre">{user.firstName || "Moi"}</p>
            <p className="truncate text-[11px] font-medium text-muted">@{user.username}</p>
          </div>
          <UserMenu />
        </div>
      ) : null}
      <nav className="flex flex-col gap-1 px-1 text-[11px] font-bold uppercase tracking-wide text-encre/80" aria-label="Liens de pied">
        <div className="flex gap-x-3"><Link href="/a-propos" className="hover:text-encre">À propos</Link><Link href="/aide" className="hover:text-encre">Aide</Link></div>
        <div className="flex gap-x-3"><Link href="/conditions" className="hover:text-encre">Conditions</Link><Link href="/confidentialite" className="hover:text-encre">Confidentialité</Link></div>
      </nav>
    </div>
  );
}
