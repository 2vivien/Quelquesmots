/** Gardes d'authentification et d'autorisation pour les routes API. */
import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "@/features/auth";
import { forbidden, unauthorized } from "./http";
import { findUserById } from "./repository";
import { getSessionUserId } from "./session";

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

/** Utilisateur connecté depuis le cookie de session, ou `null`. */
export async function getSessionUser(req: NextRequest): Promise<AuthUser | null> {
  const userId = await getSessionUserId(req);
  if (!userId) return null;
  return findUserById(userId);
}

/** Exige un utilisateur connecté ; renvoie 401 sinon. */
export async function requireUser(req: NextRequest): Promise<AuthResult> {
  const user = await getSessionUser(req);
  if (!user) return { ok: false, response: unauthorized() };
  return { ok: true, user };
}

/** Exige le rôle administrateur ; renvoie 401/403 sinon. */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const auth = await requireUser(req);
  if (!auth.ok) return auth;
  if (auth.user.role !== "admin") {
    return { ok: false, response: forbidden("Réservé à l'administration.") };
  }
  return auth;
}
