/**
 * Sessions signées HMAC-SHA256.
 * Cookie `qm_session` : `base64url({ uid, exp }).base64url(signature)`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "qm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEV_FALLBACK_SECRET = "qm-dev-secret-change-me";

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET est obligatoire en production.");
    }
    return DEV_FALLBACK_SECRET;
  }
  if (Buffer.byteLength(value, "utf8") < 32) {
    throw new Error("SESSION_SECRET doit contenir au moins 32 octets.");
  }
  return value;
}

const base64url = (buf: Buffer): string =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64url = (value: string): Buffer =>
  Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function sign(data: string): string {
  return base64url(createHmac("sha256", secret()).update(data).digest());
}

function encodeSession(userId: string): string {
  const payload = base64url(
    Buffer.from(JSON.stringify({ uid: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })),
  );
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string): string | null {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(fromBase64url(payload).toString("utf8")) as { uid?: unknown; exp?: unknown };
    if (typeof parsed.uid !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp * 1000 < Date.now()) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}

/** Identifiant utilisateur depuis le cookie de session, ou `null`. */
export function getSessionUserId(req: NextRequest): string | null {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  return raw ? decodeSession(raw) : null;
}

/** Dépose le cookie de session signé sur la réponse. */
export function setSessionCookie(res: NextResponse, userId: string): void {
  res.cookies.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Supprime le cookie de session. */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
