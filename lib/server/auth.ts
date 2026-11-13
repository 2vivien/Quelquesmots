/** Gardes d'authentification et d'autorisation pour les routes API. */
import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "@/features/auth";
import { forbidden, unauthorized } from "./http";
import { findUserById } from "./store";
import { getSessionUserId } from "./session";

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

/** Utilisateur connecté depuis le cookie de session, ou `null`. */
export function getSessionUser(req: NextRequest): AuthUser | null {
  const userId = getSessionUserId(req);
  return userId ? findUserById(userId) : null;
}

/** Exige un utilisateur connecté ; renvoie 401 sinon. */
export function requireUser(req: NextRequest): AuthResult {
  const user = getSessionUser(req);
  if (!user) return { ok: false, response: unauthorized() };
  return { ok: true, user };
}

/** Exige le rôle administrateur ; renvoie 401/403 sinon. */
export function requireAdmin(req: NextRequest): AuthResult {
  const auth = requireUser(req);
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") {
    return { ok: false, response: forbidden("Réservé à l'administration.") };
  }
  return auth;
}
