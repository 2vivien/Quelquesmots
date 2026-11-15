"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useGooglePopup } from "../hooks/useGooglePopup";
import { ConnexionCard } from "./ConnexionCard";

const OAUTH_ERRORS: Record<string, string> = {
  "etat-invalide": "La connexion a expiré ou a été interrompue. Veuillez réessayer.",
  "google-non-configure": "La connexion Google n'est pas configurée sur ce serveur.",
  "echange-echoue": "Google n'a pas pu confirmer votre identité. Veuillez réessayer.",
  "token-invalide": "Google a renvoyé une réponse invalide. Veuillez réessayer.",
  "profil-indisponible": "Impossible de récupérer votre profil Google. Veuillez réessayer.",
  "profil-invalide": "Les informations de votre compte Google sont incomplètes.",
};

function readErrorMessage(): string | null {
  if (typeof window === "undefined") return null;
  const code = new URLSearchParams(window.location.search).get("erreur");
  if (!code) return null;
  return OAUTH_ERRORS[code] ?? "La connexion a échoué. Veuillez réessayer.";
}

/**
 * Popup de connexion : ne s'affiche JAMAIS à l'arrivée ; uniquement au clic explicite
 * sur « Connexion » (événement qm:open-auth) ou au retour d'un OAuth Google échoué (?erreur=…).
 */
export function AuthPopup() {
  const pathname = usePathname();
  const { user, hydrated } = useAuth();
  // SSR-safe : toujours fermé côté serveur. Sur demande explicite ou erreur OAuth, on ouvre.
  const [shown, setShown] = useState(() => (typeof window === "undefined" ? false : readErrorMessage() !== null));
  const [errorMessage] = useState(readErrorMessage);

  useEffect(() => {
    const open = () => setShown(true);
    window.addEventListener("qm:open-auth", open);
    return () => window.removeEventListener("qm:open-auth", open);
  }, []);

  const { loading, signIn } = useGooglePopup(() => window.location.reload());

  const onAuthRoutes = pathname?.startsWith("/auth") ?? false;
  if (!hydrated || user || onAuthRoutes || !shown) return null;

  const close = () => setShown(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connexion"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-encre/35 p-4 backdrop-blur-md"
    >
      {errorMessage ? (
        <p role="alert" className="absolute left-1/2 top-6 w-full max-w-md -translate-x-1/2 rounded-[12px] border border-bord bg-carte px-4 py-3 text-center text-sm text-encre shadow-lg">
          {errorMessage}
        </p>
      ) : null}
      <ConnexionCard onGoogleLogin={signIn} loading={loading} onClose={close} />
    </div>
  );
}
