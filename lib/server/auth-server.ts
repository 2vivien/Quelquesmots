/**
 * Session côté Server Components (Next.js `next/headers`).
 * À ne pas importer depuis un composant client : lit le cookie de la requête courante.
 * Mémorisé par requête React pour éviter des allers-retours DB répétés dans une même page.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import type { AuthUser } from "@/features/auth";
import { findUserById } from "./repository";
import { resolveSessionUserIdFromToken, SESSION_COOKIE } from "./session";

/** Utilisateur connecté pour la requête courante, ou `null` pour un invité. */
export const getServerSessionUser = cache(async (): Promise<AuthUser | null> => {
  const store = await cookies();
  const userId = await resolveSessionUserIdFromToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return findUserById(userId);
});
