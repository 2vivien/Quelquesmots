"use client";

import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { GoogleMark, DecorativePill } from "./ConnexionParts";

interface ConnexionCardProps {
  onGoogleLogin: () => void;
  loading: boolean;
  /** Remplit la fenêtre popup OAuth (pleine hauteur, sans coins arrondis). */
  fill?: boolean;
  /** Ferme le popup lorsqu'il est affiché en overlay plein écran (sinon rien). */
  onClose?: () => void;
}

/**
 * Écran de connexion 9:16 « Quelques mots ».
 * Fond = l'affiche officielle (auth.jpg), reprenant les lettres au-dessus d'un enfant qui écrit ;
 * pastilles accrochées façon Trugly + CTA Google posé sur le demi-cercle jaune.
 */
export function ConnexionCard({ onGoogleLogin, loading, fill = false, onClose }: ConnexionCardProps) {
  return (
    <div className={fill ? "fixed inset-0 z-[70] h-full w-full bg-[#FAF2EA]" : "shrink-0"}>
      <div
        className={`relative overflow-hidden ${
          fill
            ? "h-full w-full bg-[#FAF2EA]"
            : "h-[min(620px,86vh)] aspect-[9/16] rounded-[28px] border-[3px] border-encre bg-[#FAF2EA] shadow-[10px_10px_0_0_var(--color-ink-jar)] ring-1 ring-black/10"
        }`}
      >
        {/* Affiche officielle (auth.jpg) — plein cadre derrière tout le reste */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/editorial/auth.jpg"
          alt="Quelques mots — une personne écrit à son bureau, des lettres et des smileys flottent au-dessus d'elle"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        />

        {/* Barre de pastilles accrochées (récupère celles de l'app) */}
        <div className="absolute left-0 right-14 top-5 z-10 flex items-start justify-center gap-4">
          <DecorativePill bg="#FFE37E" length={14}>#vie</DecorativePill>
          <DecorativePill bg="#FFB4CF" length={26}>#amour</DecorativePill>
          <DecorativePill bg="#BDE0FE" length={18}>#espoir</DecorativePill>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la connexion"
            className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-encre bg-ivoire text-encre shadow-[2px_2px_0_0_var(--color-ink-jar)] transition hover:-translate-y-0.5 hover:bg-jaune"
          >
            <X size={20} strokeWidth={2.25} aria-hidden="true" />
          </button>
        ) : null}

        {/* Bouton Google + consentement, ancrés sur la bande jaune du bas */}
        <div className="absolute inset-x-0 bottom-0 z-10 border-t-[3px] border-encre bg-jaune px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border-[2px] border-encre bg-white px-4 py-3 text-[15px] font-extrabold text-encre shadow-[3px_3px_0_0_var(--color-ink-jar)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink-jar)] disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleMark />}
            <span className="whitespace-nowrap">{loading ? "Connexion…" : "Continuer avec Google"}</span>
          </button>
          <p className="mt-2 text-center text-[10px] leading-snug text-encre/90">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/conditions" className="font-semibold underline underline-offset-2 hover:text-black">
              Conditions
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="font-semibold underline underline-offset-2 hover:text-black">
              Politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
