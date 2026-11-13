"use client";

import { STUDIO_LIMITS } from "../schemas/publish.schema";

interface CharCounterProps {
  length: number;
}

/**
 * Compteur de caractères passant en encre foncée à partir de 90 % de la limite.
 * @param props Nombre courant de caractères.
 */
export function CharCounter({ length }: CharCounterProps) {
  const high = length >= STUDIO_LIMITS.BODY_MAX * 0.9;
  return (
    <span className={`text-xs tabular-nums ${high ? "font-medium text-encre" : "text-muted"}`}>
      {length} / {STUDIO_LIMITS.BODY_MAX} caractères
    </span>
  );
}
