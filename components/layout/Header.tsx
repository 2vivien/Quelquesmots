"use client";

import Link from "next/link";
import { Bell, LogIn, Plus } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useNotifications } from "@/features/notifications";
import { openAuthPopup } from "@/lib/open-auth";
import { UserMenu } from "./UserMenu";

/** Barre supérieure fine : logotype à gauche sur mobile, actions à droite (Écrire, cloche, avatar). */
export function Header() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-30 border-b border-bord bg-ivoire/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="font-display text-[15px] uppercase leading-none tracking-tight text-encre lg:hidden">
          Quelques mots
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          {user ? (
            <>
              <Link href="/studio" className="btn-jaune hidden !min-h-[38px] !px-4 !py-0 !text-[13px] sm:inline-flex">
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
                Écrire
              </Link>
              <Link href="/notifications" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full text-encre hover:bg-pilule lg:hidden">
                <Bell size={19} strokeWidth={1.75} aria-hidden="true" />
                {unreadCount > 0 ? <span className="badge-noir absolute right-1 top-1">{unreadCount}</span> : null}
              </Link>
              <UserMenu />
            </>
          ) : (
            <button type="button" onClick={openAuthPopup} aria-label="Se connecter" className="flex h-10 w-10 items-center justify-center rounded-full text-encre hover:bg-pilule">
              <LogIn size={19} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
