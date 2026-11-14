/**
 * Sessions persistées en PostgreSQL (cookie `qm_session` = jeton opaque).
 * La table `sessions` ne stocke que le hash SHA-256 du jeton ; la révocation
 * consiste à supprimer la ligne. Aucune clé de signature n'est nécessaire car
 * le jeton opaque est impossible à deviner.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, gt, lte, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "qm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 jours

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

/** Suppression des sessions expirées (ménagé à chaque création). */
async function pruneExpiredSessions(now: Date = new Date()): Promise<void> {
  try {
    const db = getDatabase();
    await db.delete(sessions).where(lte(sessions.expiresAt, now));
  } catch {
    // La perte de ce ménage ne doit jamais casser la connexion.
  }
}

/** Crée une session persistée et renvoie le jeton opaque. */
export async function createSession(
  userId: string,
  metadata?: { userAgent?: string | null; ipHash?: string | null },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  const db = getDatabase();
  await db.insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt,
    lastUsedAt: now,
    userAgent: metadata?.userAgent ?? null,
    ipHash: metadata?.ipHash ?? null,
  });
  return { token, expiresAt };
}

/** Résout le cookie en jeton actif ou `null`. */
export async function getSessionUserId(req: NextRequest): Promise<string | null> {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const db = getDatabase();
  const now = new Date();
  // Retrouve le propriétaire du jeton haché encore valide, avec une jointure sur la ligne utilisateur.
  const rows = await db
    .select({ id: users.id })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(raw)), gt(sessions.expiresAt, now)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  // Best-effort : rafraîchit lastUsedAt sans casser la requête.
  db.update(sessions).set({ lastUsedAt: new Date() }).where(eq(sessions.tokenHash, hashToken(raw))).catch(() => {});
  return row.id;
}

/** Dépose le cookie httpOnly sur la réponse. */
export async function setSessionCookie(res: NextResponse, userId: string, metadata?: { userAgent?: string | null; ipHash?: string | null }): Promise<void> {
  await pruneExpiredSessions();
  const { token, expiresAt } = await createSession(userId, metadata);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    expires: expiresAt,
  });
}

/** Déconnexion : supprime la ligne de session correspondant au cookie. */
export async function clearSessionCookie(res: NextResponse, req?: NextRequest): Promise<void> {
  const raw = req?.cookies.get(SESSION_COOKIE)?.value;
  if (raw) {
    try {
      const db = getDatabase();
      await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw)));
    } catch {
      // La ligne peut ne pas exister ; le cookie est effacé quoi qu'il arrive.
    }
  }
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Supprime toutes les sessions d'un utilisateur (mots de passe réinitialisés, suppression de compte…). */
export async function deleteSessionsForUser(userId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
