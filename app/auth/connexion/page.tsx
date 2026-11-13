"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authService } from "@/features/auth/services/auth.service";
import { env } from "@/lib/env";
import { ConnexionCard } from "@/features/auth";

/**
 * Popup de connexion 9:16 : l'affiche « Quelques mots » en plein écran.
 * - Démo : un clic ouvre la session locale puis ferme la popup.
 * - Réel : un clic redirige cette popup vers le consentement Google (retour sur /auth/complete).
 */
function ConnexionPopup() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const asNew = params.get("as") === "new";

  const handleGoogle = () => {
    setLoading(true);
    if (env.USE_MOCK) {
      void authService.signInWithGoogle(asNew).then(() => {
        window.opener?.postMessage({ type: "qm:auth:complete" }, window.location.origin);
        window.setTimeout(() => window.close(), 250);
      });
      return;
    }
    window.location.assign(`/api/auth/signin/google?popup=1${asNew ? "&as=new" : ""}`);
  };

  return <ConnexionCard fill onGoogleLogin={handleGoogle} loading={loading} />;
}

/** Popup de connexion (414×736), encapsulée dans Suspense (useSearchParams). */
export default function AuthConnexionPopupPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[70] bg-[#FAF2EA]" />}>
      <ConnexionPopup />
    </Suspense>
  );
}
