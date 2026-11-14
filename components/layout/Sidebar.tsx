"use client";

import Link from "next/link";
import Image from "next/image";
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

type IconComponent = typeof Home;

interface NavItemProps {
  href: string;
  label: string;
  Icon: IconComponent | typeof IconUserSquare;
  bg: string;
  active: boolean;
}

/** Pastille de navigation néo-brutalisme façon Trugly : icône en tuile colorée + libellé. */
function NavRow({ href, label, Icon, bg, active }: NavItemProps) {
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
function HangingPill({ href, bg, length, children }: { href: string; bg: string; length: number; children: string }) {
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

/** Barre latérale de navigation (Trugly) : fond teal, boutons épais, pills accrochées. */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const is = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false);

  return (
    <aside aria-label="Navigation principale" className="fixed bottom-0 left-0 top-0 z-40 hidden w-72 flex-col gap-4 border-r-2 border-encre bg-teal px-5 py-6 lg:flex">
      {/* En-tête */}
      <Link href="/" className="flex items-center gap-2 px-1 transition-transform hover:-translate-y-0.5">
        <Image
          src="/images/editorial/plume.png"
          alt="Plume Quelques mots"
          width={44}
          height={77}
          className="h-14 w-auto select-none drop-shadow-[1px_1px_0_var(--color-ink-jar)]"
          priority
        />
        <span className="font-display text-[20px] uppercase leading-[0.92] tracking-tight text-encre">
          Quelques<br />mots
        </span>
      </Link>

      {/* Bouton principal */}
      <Link href="/studio" className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-encre bg-lime px-5 py-3 font-display text-base uppercase tracking-wider text-encre shadow-[4px_4px_0_0_var(--color-ink-jar)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-ink-jar)] active:translate-y-0">
        <PenLine size={18} strokeWidth={2.5} aria-hidden="true" />
        Écrire
      </Link>

      {/* Boutons accrochés */}
      <div aria-hidden="true" className="flex items-start justify-center gap-3">
        <HangingPill href="/tags/vie" bg="#FFE37E" length={14}>#vie</HangingPill>
        <HangingPill href="/tags/amour" bg="#FFB4CF" length={26}>#amour</HangingPill>
        <HangingPill href="/tags/espoir" bg="#BDE0FE" length={18}>#espoir</HangingPill>
      </div>

      {/* Navigation principale */}
      <nav className="flex flex-col gap-2" aria-label="Sections">
        <NavRow href="/" label="Le mur" Icon={Home} bg="#CFFB7F" active={is("/")} />
        <NavRow href="/themes" label="Thèmes" Icon={Hash} bg="#BDE0FE" active={is("/themes")} />
        <NavRow href="/auteurs" label="Auteurs" Icon={IconUserSquare} bg="#FFB4CF" active={is("/auteurs")} />
      </nav>

      {/* Mon compte */}
      {user ? (
        <nav className="flex flex-col gap-2" aria-label="Mon compte">
          <NavRow href="/studio/brouillons" label="Brouillons" Icon={PenLine} bg="#FFE37E" active={is("/studio/brouillons")} />
          <NavRow href="/bibliotheque" label="Bibliothèque" Icon={BookMarked} bg="#FFB3A0" active={is("/bibliotheque")} />
          <NavRow href="/parametres" label="Paramètres" Icon={Settings} bg="#EFE3CC" active={is("/parametres")} />
          {user.role === "admin" ? <NavRow href="/admin" label="Modération" Icon={Shield} bg="#CDFA98" active={is("/admin")} /> : null}
        </nav>
      ) : null}

      {/* Citation déco */}
      <figure className="rounded-2xl border-2 border-encre bg-carte px-4 py-3 shadow-[3px_3px_0_0_var(--color-ink-jar)]">
        <blockquote className="font-serif text-[13px] italic leading-snug text-encre">
          « Quelques mots suffisent<br />pour faire germer une idée. »
        </blockquote>
      </figure>

      {/* Pied + utilisateur connecté */}
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
    </aside>
  );
}
