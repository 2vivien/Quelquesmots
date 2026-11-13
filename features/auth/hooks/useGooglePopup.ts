"use client";

import { useCallback, useState } from "react";
import { authService } from "../services/auth.service";
import { env } from "@/lib/env";

/** Proportions 9:16 de la fenêtre popup OAuth. */
const POPUP_FEATURES = "popup=yes,width=414,height=736,resizable=yes,scrollbars=yes";

/**
 * Flux « Continuer avec Google » : session de démonstration instantanée en mode mock,
 * sinon fenêtre popup 9:16 menant au consentement Google.
 * @param onComplete Appelé une fois la connexion terminée.
 * @returns État `loading` et action `signIn`.
 */
export function useGooglePopup(onComplete: () => void) {
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(() => {
    setLoading(true);
    if (env.USE_MOCK) {
      authService
        .signInWithGoogle(false)
        .then(() => {
          setLoading(false);
          onComplete();
        })
        .catch(() => setLoading(false));
      return;
    }
    const popup = window.open("/api/auth/signin/google?popup=1", "qm-google", POPUP_FEATURES);
    if (!popup) {
      // Popup bloquée : repli sur une redirection plein écran.
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
      setLoading(false);
      onComplete();
    };
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        setLoading(false);
        onComplete();
      }
    }, 500);
    window.addEventListener("message", onMessage);
  }, [onComplete]);

  return { loading, signIn };
}
