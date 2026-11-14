"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookMarked,
  Hash,
  Home,
  Info,
  LifeBuoy,
  LogIn,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { IconUserSquare } from "@tabler/icons-react";
import { useAuth } from "@/features/auth";
import { useNotifications } from "@/features/notifications";
import { openAuthPopup } from "@/lib/open-auth";

/** Menu hamburger mobile (< lg) : tiroir latéral droit avec la navigation complète. */
export function MobileMenu() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => setOpen(false);
  const is = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false);
  const rowCls = (active: boolean) =>
    `flex h-12 items-center gap-3 rounded-2xl border-[1.5px] border-bord px-4 text-[15px] font-bold transition-all ${
      active ? "bg-jaune shadow-[2px_2px_0_0_var(--color-encre)]" : "bg-carte"
    }`;

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open} className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-bord bg-carte text-encre shadow-[2px_2px_0_0_var(--color-encre)] transition-colors hover:bg-pilule">
        <Menu size={20} strokeWidth={2} aria-hidden="true" />
      </button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50">
          <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-encre/40 backdrop-blur-sm" />
          <div className="absolute bottom-0 right-0 top-0 flex w-[85vw] max-w-sm flex-col gap-4 overflow-y-auto border-l-[1.5px] border-bord bg-ivoire p-5 shadow-[-4px_0_24px_rgba(40,37,36,0.25)]">
            <div className="flex items-center justify-between">
              <Link href="/" className="font-display text-lg uppercase leading-none tracking-tight text-encre" onClick={() => setOpen(false)}>
                Quelques mots
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-bord bg-carte text-encre transition-colors hover:bg-pilule">
                <X size={20} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex flex-col gap-2" aria-label="Sections">
              <Link href="/" onClick={close} className={rowCls(is("/"))}><Home size={19} strokeWidth={2} aria-hidden="true" /><span>Le mur</span></Link>
              <Link href="/themes" onClick={close} className={rowCls(is("/themes"))}><Hash size={19} strokeWidth={2} aria-hidden="true" /><span>Thèmes</span></Link>
              <Link href="/auteurs" onClick={close} className={rowCls(is("/auteurs"))}><IconUserSquare size={19} strokeWidth={2} aria-hidden="true" /><span>Auteurs</span></Link>
              <Link href="/a-propos" onClick={close} className={rowCls(is("/a-propos"))}><Info size={19} strokeWidth={2} aria-hidden="true" /><span>À propos</span></Link>
              <Link href="/aide" onClick={close} className={rowCls(is("/aide"))}><LifeBuoy size={19} strokeWidth={2} aria-hidden="true" /><span>Aide</span></Link>
            </nav>
            {user ? (
              <nav className="flex flex-col gap-2" aria-label="Mon compte">
                <Link href="/studio" className="btn-jaune" onClick={close}><PenLine size={18} strokeWidth={2.25} aria-hidden="true" />Écrire</Link>
                <Link href="/studio/brouillons" onClick={close} className={rowCls(is("/studio/brouillons"))}><PenLine size={17} strokeWidth={2} aria-hidden="true" /><span>Brouillons</span></Link>
                <Link href="/bibliotheque" onClick={close} className={rowCls(is("/bibliotheque"))}><BookMarked size={17} strokeWidth={2} aria-hidden="true" /><span>Bibliothèque</span></Link>
                <Link href="/notifications" onClick={close} className={rowCls(is("/notifications"))}><Bell size={17} strokeWidth={2} aria-hidden="true" /><span>Notifications</span>{unreadCount > 0 ? <span className="badge-noir ml-auto">{unreadCount}</span> : null}</Link>
                <Link href="/parametres" onClick={close} className={rowCls(is("/parametres"))}><Settings size={17} strokeWidth={2} aria-hidden="true" /><span>Paramètres</span></Link>
                {user.role === "admin" ? <Link href="/admin" onClick={close} className={rowCls(is("/admin"))}><Shield size={17} strokeWidth={2} aria-hidden="true" /><span>Modération</span></Link> : null}
                <button type="button" onClick={() => { setOpen(false); void signOut(); }} className="flex h-12 items-center gap-3 rounded-2xl border-[1.5px] border-bord bg-carte px-4 text-[15px] font-bold text-encre transition-colors hover:bg-pilule"><LogOut size={17} strokeWidth={2} aria-hidden="true" /><span>Déconnexion</span></button>
              </nav>
            ) : (
              <div className="mt-auto space-y-3 border-t-[1.5px] border-bord pt-4">
                <p className="px-1 text-center text-sm font-semibold text-muted">Connecte-toi pour publier et commenter.</p>
                <button type="button" onClick={() => { setOpen(false); openAuthPopup(); }} className="btn-noir w-full"><LogIn size={17} strokeWidth={2.25} aria-hidden="true" />Connexion</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
