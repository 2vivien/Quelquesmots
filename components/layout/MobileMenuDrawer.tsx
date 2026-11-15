"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, BookMarked, Hash, Home, LogOut, PenLine, Settings, Shield, X } from "lucide-react";
import { IconUserSquare } from "@tabler/icons-react";
import { useAuth } from "@/features/auth";
import { useNotifications } from "@/features/notifications";
import { usePopularTags } from "@/features/tags";
import { HangingPill, NavRow, SidebarFooter } from "./sidebar-items";
import { openAuthPopup } from "@/lib/open-auth";

interface MobileMenuDrawerProps {
  onClose: () => void;
}

/** Tiroir mobile identique au sidebar desktop (mêmes tuiles, teal, bordures épaisses). */
export function MobileMenuDrawer({ onClose }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { data: tags = [] } = usePopularTags();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false;

  // Tags mis en avant, uniquement ceux réellement approuvés en base.
  const featured = ["vie", "amour", "espoir"]
    .map((label) => tags.find((t) => t.label === label))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[70] lg:hidden">
      <button type="button" aria-label="Fermer le menu" onClick={onClose} className="absolute inset-0 bg-encre/40 backdrop-blur-sm" />
      <div className="absolute bottom-0 right-0 top-0 flex w-[85vw] max-w-sm flex-col gap-4 overflow-y-auto border-l-2 border-encre bg-teal p-4 text-encre">
        {/* En-tête identique au sidebar (logo + wordmark) */}
        <div className="flex items-center justify-between px-1">
          <Link href="/" onClick={onClose} aria-label="Accueil — Quelques mots">
            <Image
              src="/images/editorial/plume.png"
              alt="Plume Quelques mots"
              width={44}
              height={77}
              className="h-14 w-auto select-none drop-shadow-[1px_1px_0_var(--color-ink-jar)]"
              priority
            />
          </Link>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte text-encre shadow-[2px_2px_0_0_var(--color-ink-jar)] transition-colors hover:bg-pilule">
            <X size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* CTA principal identique au sidebar */}
        <Link href="/studio" onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-encre bg-lime px-5 py-3 font-display text-base uppercase tracking-wider text-encre shadow-[4px_4px_0_0_var(--color-ink-jar)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-ink-jar)] active:translate-y-0">
          <PenLine size={18} strokeWidth={2.5} aria-hidden="true" />
          Écrire
        </Link>

        {/* Tags mis en avant (approuvés en base) */}
        {featured.length > 0 ? (
          <div aria-hidden="true" className="flex items-start justify-center gap-3">
            {featured.map((tag, i) => (
              <HangingPill key={tag.id} onNavigate={onClose} href={`/tags/${tag.id}`} bg={["#FFE37E", "#FFB4CF", "#BDE0FE"][i % 3]!} length={[14, 26, 18][i % 3]!}>{`#${tag.label}`}</HangingPill>
            ))}
          </div>
        ) : null}

        {/* Navigation principale */}
        <nav className="flex flex-col gap-2" aria-label="Sections">
          <NavRow onNavigate={onClose} href="/" label="Le mur" Icon={Home} bg="#CFFB7F" active={isActive("/")} />
          <NavRow onNavigate={onClose} href="/themes" label="Thèmes" Icon={Hash} bg="#BDE0FE" active={isActive("/themes")} />
          <NavRow onNavigate={onClose} href="/auteurs" label="Auteurs" Icon={IconUserSquare} bg="#FFB4CF" active={isActive("/auteurs")} />
        </nav>

        {user ? (
          <nav className="flex flex-col gap-2" aria-label="Mon compte">
            <NavRow onNavigate={onClose} href="/studio/brouillons" label="Brouillons" Icon={PenLine} bg="#FFE37E" active={isActive("/studio/brouillons")} />
            <NavRow onNavigate={onClose} href="/bibliotheque" label="Bibliothèque" Icon={BookMarked} bg="#FFB3A0" active={isActive("/bibliotheque")} />
            <NavRow onNavigate={onClose} href="/notifications" label="Notifications" Icon={Bell} bg="#F6C1A8" active={isActive("/notifications")} />
            <NavRow onNavigate={onClose} href="/parametres" label="Paramètres" Icon={Settings} bg="#EFE3CC" active={isActive("/parametres")} />
            {user.role === "admin" ? <NavRow onNavigate={onClose} href="/admin" label="Modération" Icon={Shield} bg="#CDFA98" active={isActive("/admin")} /> : null}
            <button type="button" onClick={() => { onClose(); void signOut(); }} className="flex h-12 items-center gap-3 rounded-2xl border-2 border-encre bg-carte px-4 text-[15px] font-extrabold text-encre shadow-[2px_2px_0_0_var(--color-ink-jar)] transition-colors hover:bg-pilule">
              <LogOut size={17} strokeWidth={2.5} aria-hidden="true" /><span>Déconnexion</span>
            </button>
          </nav>
        ) : (
          <div className="mt-auto space-y-3 border-t-2 border-encre pt-4">
            <p className="px-1 text-center text-sm font-bold text-encre">Connecte-toi pour publier et commenter.</p>
            <button type="button" onClick={() => { onClose(); openAuthPopup(); }} className="flex w-full items-center justify-center rounded-full border-2 border-encre bg-encre px-5 py-3.5 font-display text-base uppercase tracking-wider text-ivoire shadow-[3px_3px_0_0_rgba(40,37,36,0.35)]">
              <span className="whitespace-nowrap">Connexion</span>
            </button>
          </div>
        )}

        {/* Pied identique au sidebar (carte utilisateur + liens) */}
        <SidebarFooter user={user ?? null} />
      </div>
    </div>
  );
}
