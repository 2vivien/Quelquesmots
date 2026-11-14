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
import { usePopularTags } from "@/features/tags";
import { HangingPill, NavRow, SidebarFooter } from "./sidebar-items";

/** Barre latérale de navigation (Trugly) : fond teal, boutons épais, pills accrochées. */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: tags = [] } = usePopularTags();
  const is = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false);

  // Tags mis en avant : par libellé, uniquement s'ils existent réellement en base.
  const featured = ["vie", "amour", "espoir"]
    .map((label) => tags.find((t) => t.label === label))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

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

      {/* Boutons accrochés (tags populaires réellement approuvés) */}
      {featured.length > 0 ? (
        <div aria-hidden="true" className="flex items-start justify-center gap-3">
          {featured.map((tag, index) => {
            const bg = ["#FFE37E", "#FFB4CF", "#BDE0FE"][index % 3]!;
            const lengths = [14, 26, 18];
            return (
              <HangingPill key={tag.id} href={`/tags/${tag.id}`} bg={bg} length={lengths[index % 3]!}>
                {`#${tag.label}`}
              </HangingPill>
            );
          })}
        </div>
      ) : null}

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

      <SidebarFooter user={user ?? null} />
    </aside>
  );
}
