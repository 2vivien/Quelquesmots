"use client";

import Link from "next/link";
import { Feather } from "lucide-react";

interface LoginCardProps {
  retourHref: string;
  onGoogleLogin: () => void;
  loading: boolean;
}

/** Carte d'accueil de connexion fidèle à l'écran 12 de la maquette. */
export function LoginCard({ retourHref, onGoogleLogin, loading }: LoginCardProps) {
  return (
    <section className="mx-auto w-full max-w-md rounded-[16px] border border-bord bg-carte px-8 py-12 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-pilule text-encre">
        <Feather size={22} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h1 className="font-serif text-3xl font-normal text-encre">Bienvenue sur Quelques mots</h1>
      <p className="mt-2.5 text-[15px] text-muted">Connectez-vous pour rejoindre la communauté</p>
      <button type="button" disabled={loading} onClick={onGoogleLogin} className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full border border-bord bg-white px-5 py-2.5 text-sm font-medium text-encre hover:bg-pilule/60 disabled:opacity-60">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ivoire text-xs font-semibold text-encre">G</span>
        <span className="whitespace-nowrap">Continuer avec Google</span>
      </button>
      <Link href={retourHref} className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:text-encre hover:underline">
        Plus tard
      </Link>
    </section>
  );
}
