"use client";

/** Rouvre le popup de connexion obligatoire (annulant une fermeture précédente). */
export function openAuthPopup(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("qm_auth_popup_dismissed");
  window.dispatchEvent(new CustomEvent("qm:open-auth"));
}
