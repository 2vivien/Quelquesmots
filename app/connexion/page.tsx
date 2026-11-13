"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { env } from "@/lib/env";
import { ConnexionCard } from "@/features/auth";

const OAUTH_ERRORS: Record<string, string> = {
  "etat-invalide": "La connexion a expiré ou a été interrompue. Veuillez réessayer.",
  "google-non-configure": "La connexion Google n'est pas configurée sur ce serveur.",
  "echange-echoue": "Google n'a pas pu confirmer votre identité. Veuillez réessayer.",
  "token-invalide": "Google a renvoyé une réponse invalide. Veuillez réessayer.",
  "profil-indisponible": "Impossible de récupérer votre profil Google. Veuillez réessayer.",
  "profil-invalide": "Les informations de votre compte Google sont incomplètes.",
};

/** Proportions 9:16 de la popup de connexion (type téléphone). */
const POPUP_FEATURES = "popup=yes,width=414,height=736,resizable=yes,scrollbars=yes";

function ConnexionInner() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  const rawRetour = params.get("retour") ?? "/";
  const safeRetour = rawRetour.startsWith("/") && !rawRetour.startsWith("//") ? rawRetour : "/";
  const oauthError = params.get("erreur");
  const errorMessage = oauthError ? (OAUTH_ERRORS[oauthError] ?? "La connexion a échoué. Veuillez réessayer.") : null;

  /** Redirige vers la destination adaptée une fois la session active. */
  const finishAuth = async () => {
    setLoading(false);
    const u = await authService.getCurrentUser();
    window.location.assign(u?.onboarded ? safeRetour : "/bienvenue");
  };

  const handleGoogle = () => {
    setLoading(true);
    // Mode démonstration : session locale instantanée, sans popup.
    if (env.USE_MOCK) {
      void authService
        .signInWithGoogle(false)
        .then((u) => window.location.assign(u?.onboarded ? safeRetour : "/bienvenue"))
        .catch(() => setLoading(false));
      return;
    }
    // Mode réel : la connexion Google s'ouvre dans une popup 9:16.
    const popup = window.open("/auth/connexion", "qm-connexion", POPUP_FEATURES);
    if (!popup) {
      setLoading(false);
      window.location.assign("/api/auth/signin/google");
      return;
    }
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(timer);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type !== "qm:auth:complete") return;
      cleanup();
      void finishAuth();
    };
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        void finishAuth();
      }
    }, 500);
    window.addEventListener("message", onMessage);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connexion obligatoire"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-encre/35 p-4 backdrop-blur-md"
    >
      {errorMessage ? (
        <p role="alert" className="absolute left-1/2 top-6 w-full max-w-md -translate-x-1/2 rounded-[12px] border border-bord bg-carte px-4 py-3 text-sm text-encre shadow-lg">
          {errorMessage}
        </p>
      ) : null}
      <ConnexionCard onGoogleLogin={handleGoogle} loading={loading} />
    </div>
  );
}

/** Page de connexion — écran d'authentification 9:16 (écran 12). */
export default function ConnexionPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-[414px] animate-pulse rounded-[28px] bg-pilule" />}>
      <ConnexionInner />
    </Suspense>
  );
}
