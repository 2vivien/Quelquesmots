"use client";

import { Feather } from "lucide-react";
import { useEffect } from "react";

/**
 * Écran intermédiaire affiché dans la popup OAuth après une connexion réussie.
 * Notifie la fenêtre d'origine puis se referme ; couvert plein écran pour masquer le layout.
 */
export default function AuthCompletePage() {
  useEffect(() => {
    window.opener?.postMessage({ type: "qm:auth:complete" }, window.location.origin);
    const timer = window.setTimeout(() => window.close(), 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-ivoire text-center">
      <Feather size={28} strokeWidth={1.25} className="animate-pulse text-encre" aria-hidden="true" />
      <p className="font-serif text-xl text-encre">Vous êtes connecté.</p>
      <p className="text-xs text-muted">Cette fenêtre va se fermer…</p>
    </div>
  );
}
