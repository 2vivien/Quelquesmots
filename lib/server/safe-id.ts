import { randomUUID } from "node:crypto";

/** Génère un identifiant préfixé pour les nouvelles lignes (utilisé par la couche de persistance). */
export function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}
