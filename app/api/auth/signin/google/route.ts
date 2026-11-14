import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { clientIp, rateLimit } from "@/lib/server/http";
import { env } from "@/lib/env";

const STATE_COOKIE = "qm_oauth_state";

/**
 * Démarre exclusivement le parcours OAuth Google.
 * `popup=1` fait transiter le drapeau popup jusqu'au callback.
 */
export async function GET(req: NextRequest) {
  const limited = await rateLimit(`signin:${clientIp(req)}`, 10, 60_000);
  if (limited) return limited;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: { code: "AUTH_NOT_CONFIGURED", message: "La connexion Google n'est pas configurée." } },
      { status: 503 },
    );
  }

  const appUrl = env.APP_URL.replace(/\/$/, "");
  const popup = req.nextUrl.searchParams.get("popup") === "1";
  const state = randomBytes(32).toString("hex") + (popup ? "|popup" : "");
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
