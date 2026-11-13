"use client";

import Link from "next/link";
import { Loader2, X } from "lucide-react";

interface ConnexionCardProps {
  onGoogleLogin: () => void;
  loading: boolean;
  /** Remplit la fenêtre popup OAuth (pleine hauteur, sans coins arrondis). */
  fill?: boolean;
  /** Ferme le popup lorsqu'il est affiché en overlay plein écran (sinon rien). */
  onClose?: () => void;
}

/** Logotype Google officiel (bouton « Continuer avec Google »). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09" />
      <path fill="#EA4335" d="M12 5.04c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 5.04 12 5.04z" />
    </svg>
  );
}

/**
 * Écran de connexion 9:16 à l'affiche « Quelques mots ».
 * Image plein cadre, bouton Google officiel par-dessus le cercle jaune, consentement en bas.
 */
export function ConnexionCard({ onGoogleLogin, loading, fill = false, onClose }: ConnexionCardProps) {
  return (
    <div className={fill ? "fixed inset-0 z-[70] h-full w-full bg-[#FAF2EA]" : "shrink-0"}>
      <div
        className={`relative overflow-hidden ${
          fill
            ? "h-full w-full"
            : "h-[min(600px,86vh)] aspect-[9/16] rounded-[28px] border border-bord bg-[#FAF2EA] shadow-2xl ring-1 ring-black/5"
        }`}
      >
        {/* Affiche Quelques mots (illustration 9:16) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/editorial/auth.jpg"
          alt="Quelques mots — une personne écrit à son bureau, des lettres et des smileys flottent au-dessus d'elle"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la connexion"
            className="absolute right-3.5 top-3.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-ivoire backdrop-blur-sm transition hover:bg-black/55"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        ) : null}
        {/* Bouton Google + consentement, ancrés sur la zone jaune en bas de l'affiche */}
        <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white/95 px-4 py-3 text-[14px] font-medium text-encre shadow-lg backdrop-blur-sm transition hover:bg-white disabled:opacity-70"
          >
            {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <GoogleMark />}
            <span className="whitespace-nowrap">{loading ? "Connexion…" : "Continuer avec Google"}</span>
          </button>
          <p className="text-center text-[10px] leading-snug text-[#282524]/90">
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
