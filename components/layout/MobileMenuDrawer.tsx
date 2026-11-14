"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, BookMarked, Hash, Home, Info, LifeBuoy, LogOut, PenLine, Settings, Shield, X,
} from "lucide-react";
import { IconUserSquare } from "@tabler/icons-react";
import { useAuth } from "@/features/auth";
import { useNotifications } from "@/features/notifications";
import { openAuthPopup } from "@/lib/open-auth";

interface MobileMenuDrawerProps {
  onClose: () => void;
}

/** Contenu du tiroir mobile, séparé du contrôleur d'ouverture. */
export function MobileMenuDrawer({ onClose }: MobileMenuDrawerProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false;
  const rowClass = (active: boolean) =>
    `flex h-12 items-center gap-3 rounded-2xl border-[1.5px] border-bord px-4 text-[15px] font-bold transition-all ${active ? "bg-jaune shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte"}`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Fermer le menu" onClick={onClose} className="absolute inset-0 bg-encre/40 backdrop-blur-sm" />
      <div className="absolute bottom-0 right-0 top-0 flex w-[85vw] max-w-sm flex-col gap-4 overflow-y-auto border-l-[1.5px] border-bord bg-ivoire p-5 shadow-[-4px_0_24px_rgba(40,37,36,0.25)]">
        <div className="flex items-center justify-between">
          <Link href="/" onClick={onClose} className="font-display text-lg uppercase leading-none tracking-tight text-encre">Quelques mots</Link>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-bord bg-carte text-encre transition-colors hover:bg-pilule">
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Sections">
          <Link href="/" onClick={onClose} className={rowClass(isActive("/"))}><Home size={19} aria-hidden="true" /><span>Le mur</span></Link>
          <Link href="/themes" onClick={onClose} className={rowClass(isActive("/themes"))}><Hash size={19} aria-hidden="true" /><span>Thèmes</span></Link>
          <Link href="/auteurs" onClick={onClose} className={rowClass(isActive("/auteurs"))}><IconUserSquare size={19} aria-hidden="true" /><span>Auteurs</span></Link>
          <Link href="/a-propos" onClick={onClose} className={rowClass(isActive("/a-propos"))}><Info size={19} aria-hidden="true" /><span>À propos</span></Link>
          <Link href="/aide" onClick={onClose} className={rowClass(isActive("/aide"))}><LifeBuoy size={19} aria-hidden="true" /><span>Aide</span></Link>
        </nav>
        {user ? (
          <nav className="flex flex-col gap-2" aria-label="Mon compte">
            <Link href="/studio" onClick={onClose} className="btn-jaune"><PenLine size={18} aria-hidden="true" />Écrire</Link>
            <Link href="/studio/brouillons" onClick={onClose} className={rowClass(isActive("/studio/brouillons"))}><PenLine size={17} aria-hidden="true" /><span>Brouillons</span></Link>
            <Link href="/bibliotheque" onClick={onClose} className={rowClass(isActive("/bibliotheque"))}><BookMarked size={17} aria-hidden="true" /><span>Bibliothèque</span></Link>
            <Link href="/notifications" onClick={onClose} className={rowClass(isActive("/notifications"))}><Bell size={17} aria-hidden="true" /><span>Notifications</span>{unreadCount > 0 ? <span className="badge-noir ml-auto">{unreadCount}</span> : null}</Link>
            <Link href="/parametres" onClick={onClose} className={rowClass(isActive("/parametres"))}><Settings size={17} aria-hidden="true" /><span>Paramètres</span></Link>
            {user.role === "admin" ? <Link href="/admin" onClick={onClose} className={rowClass(isActive("/admin"))}><Shield size={17} aria-hidden="true" /><span>Modération</span></Link> : null}
            <button type="button" onClick={() => { onClose(); void signOut(); }} className="flex h-12 items-center gap-3 rounded-2xl border-[1.5px] border-bord bg-carte px-4 text-[15px] font-bold text-encre transition-colors hover:bg-pilule"><LogOut size={17} aria-hidden="true" /><span>Déconnexion</span></button>
          </nav>
        ) : (
          <div className="mt-auto space-y-3 border-t-[1.5px] border-bord pt-4">
            <p className="px-1 text-center text-sm font-semibold text-muted">Connecte-toi pour publier et commenter.</p>
            <button type="button" onClick={() => { onClose(); openAuthPopup(); }} className="btn-noir w-full"><span className="whitespace-nowrap">Connexion</span></button>
          </div>
        )}
      </div>
    </div>
  );
}
