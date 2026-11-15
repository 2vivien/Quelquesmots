"use client";

/** Ouvre le popup de connexion — appelé uniquement après un clic explicite (header, CTA…). */
export function openAuthPopup(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("qm:open-auth"));
}
