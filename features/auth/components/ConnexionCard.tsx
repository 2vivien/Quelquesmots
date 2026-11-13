"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

interface ConnexionCardProps {
  onGoogleLogin: () => void;
  loading: boolean;
  /** Remplit la fenêtre popup (pleine hauteur, sans coins arrondis) au lieu du format carte centré. */
  fill?: boolean;
}

/**
 * Écran de connexion 9:16 à l'affiche « Quelques mots » (écran 12).
 * Image plein cadre, bouton Google par-dessus le cercle jaune, consentement en bas.
 */
export function ConnexionCard({ onGoogleLogin, loading, fill = false }: ConnexionCardProps) {
  return (
    <div className={fill ? "fixed inset-0 z-[70] h-full w-full bg-[#FAF2EA]" : "w-full max-w-[414px] shrink-0"}>
      <div
        className={`relative overflow-hidden ${
          fill
            ? "h-full w-full"
            : "aspect-[9/16] w-full rounded-[28px] border border-bord shadow-2xl ring-1 ring-black/5"
        }`}
      >
        {/* Affiche Quelques mots (illustration 9:16) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/editorial/auth.jpg"
          alt="Quelques mots — une personne écrit à son bureau, des lettres et des smileys flottent au-dessus d'elle"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Bouton Google + consentement, ancrés sur la zone jaune en bas de l'affiche */}
        <div className="absolute inset-x-5 bottom-4 flex flex-col items-center gap-3 sm:inset-x-6">
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white/95 px-5 py-3 text-[15px] font-medium text-encre shadow-lg backdrop-blur-sm transition hover:bg-white disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-5 w-5 items-center justify-center rounded-full bg-ivoire text-xs font-bold text-encre ring-1 ring-black/10"
              >
                G
              </span>
            )}
            <span className="whitespace-nowrap">{loading ? "Connexion…" : "Continuer avec Google"}</span>
          </button>
          <p className="text-center text-[10.5px] leading-snug text-[#282524]/90">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/conditions" className="font-medium underline underline-offset-2 hover:text-black">
              Conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="font-medium underline underline-offset-2 hover:text-black">
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
