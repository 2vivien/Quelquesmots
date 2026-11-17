"use client";

import { STUDIO_LIMITS } from "../schemas/publish.schema";

interface CharCounterProps {
  length: number;
}

/**
 * Compteur de caractères avec état explicite à la limite.
 * @param props Nombre courant de graphèmes.
 */
export function CharCounter({ length }: CharCounterProps) {
  const atLimit = length >= STUDIO_LIMITS.BODY_MAX;
  const high = length >= STUDIO_LIMITS.BODY_MAX * 0.9;
  return (
    <span role="status" aria-live="polite" className={`text-xs tabular-nums ${atLimit ? "font-semibold text-red-700" : high ? "font-medium text-encre" : "text-muted"}`}>
      {length.toLocaleString("fr-FR")} / {STUDIO_LIMITS.BODY_MAX.toLocaleString("fr-FR")} caractères
      {atLimit ? " — Limite atteinte" : ""}
    </span>
  );
}