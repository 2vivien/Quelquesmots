import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { setSessionCookie } from "@/lib/server/session";
import { createDemoUser, findUserById } from "@/lib/server/store";
import { clientIp, rateLimit } from "@/lib/server/http";
import { env } from "@/lib/env";

const STATE_COOKIE = "qm_oauth_state";

/**
 * Démarre la connexion Google.
 * - Avec `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` : redirection vers le consentement Google.
 * - Sinon : session de démonstration (compte invité partagé, ou nouveau compte avec `?as=new`).
 * `?popup=1` fait transiter le drapeau popup jusqu'au callback (retour sur /auth/complete).
 */
export async function GET(req: NextRequest) {
  const limited = rateLimit(`signin:${clientIp(req)}`, 10, 60_000);
  if (limited) return limited;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = env.APP_URL.replace(/\/$/, "");
  const asNew = req.nextUrl.searchParams.get("as") === "new";
  const popup = req.nextUrl.searchParams.get("popup") === "1";

  if (clientId && clientSecret) {
    const state = randomBytes(16).toString("hex") + (popup ? "|popup" : "");
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${appUrl}/api/auth/callback/google`;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    const res = NextResponse.redirect(url.toString(), 302);
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600,
    });
    return res;
  }

  // Mode démonstration : pas d'identifiants Google configurés.
  const target = popup ? `${appUrl}/auth/complete` : null;
  if (asNew) {
    const user = createDemoUser();
    const res = NextResponse.redirect(target ?? `${appUrl}/bienvenue`, 302);
    setSessionCookie(res, user.id);
    return res;
  }
  const demo = findUserById("user-emma");
  if (!demo) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Compte de démonstration indisponible." } }, { status: 500 });
  const res = NextResponse.redirect(target ?? `${appUrl}/`, 302);
  setSessionCookie(res, demo.id);
  return res;
}
