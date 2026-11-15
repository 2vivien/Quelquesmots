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
 * Écran de connexion 9:16 « Quelques mots » — le tronc imagettes des tags de l'app,
 * tronc-héros illustré et CTA officiel Google façon Trugly.
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
        {/* Rayons doux derrière le tronc */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[62%] bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,227,126,0.65),transparent_72%)]"
        />

        {/* Barre de pastilles accrochées (récupère celles de l'app) */}
        <div className="absolute left-0 right-14 top-4 z-10 flex items-start justify-center gap-4">
          <DecorativePill bg="#FFE37E" length={14}>#vie</DecorativePill>
          <DecorativePill bg="#FFB4CF" length={26}>#amour</DecorativePill>
          <DecorativePill bg="#BDE0FE" length={18}>#espoir</DecorativePill>
        </div>

        {/* Wordmark */}
        <div className="relative z-10 mt-24 flex flex-col items-center">
          <h1 className="font-display text-[44px] uppercase leading-[0.86] tracking-tight text-encre drop-shadow-[2px_2px_0_var(--color-jaune)]">
            Quelques<br />mots
          </h1>
          <p className="mt-2 font-serif text-sm italic text-encre/80">un mur de mots.</p>
        </div>

        {/* Tronc illustré, image sans fond */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/editorial/trugy_popup_sans_fond_final.png"
          alt="Tronc de héros Quelques mots — un petit arbre souriant entouré de feuilles"
          className="absolute inset-x-0 bottom-[104px] z-0 mx-auto w-[86%] max-w-[280px] object-contain"
        />

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
