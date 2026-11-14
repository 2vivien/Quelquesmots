import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/server/session";
import { findOrCreateGoogleUser, setAdminRoleForUser } from "@/lib/server/store";
import { env } from "@/lib/env";

const STATE_COOKIE = "qm_oauth_state";

const tokenSchema = z.object({ access_token: z.string().min(1) });
const userinfoSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
});

/** Conclu l'OAuth Google : échange le code, crée ou retrouve le compte, ouvre la session. */
export async function GET(req: NextRequest) {
  const appUrl = env.APP_URL.replace(/\/$/, "");
  const fail = (reason: string) =>
    NextResponse.redirect(`${appUrl}/?erreur=${encodeURIComponent(reason)}`, 302);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) return fail("etat-invalide");
  const popup = state.endsWith("|popup");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("google-non-configure");
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${appUrl}/api/auth/callback/google`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  if (!tokenRes.ok) return fail("echange-echoue");
  const tokenParsed = tokenSchema.safeParse(await tokenRes.json().catch(() => null));
  if (!tokenParsed.success) return fail("token-invalide");

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenParsed.data.access_token}` },
  });
  if (!infoRes.ok) return fail("profil-indisponible");
  const infoParsed = userinfoSchema.safeParse(await infoRes.json().catch(() => null));
  if (!infoParsed.success) return fail("profil-invalide");
  const info = infoParsed.data;

  const { user, createdNew } = await findOrCreateGoogleUser({
    googleSub: info.sub,
    email: info.email ?? null,
    givenName: info.given_name ?? null,
    familyName: info.family_name ?? null,
    avatarUrl: info.picture ?? null,
  });

  // Bootstrap : les e-mails listés dans ADMIN_EMAILS sont promus admin au premier passage.
  if (info.email) {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(info.email.toLowerCase()) && user.role !== "admin") {
      await setAdminRoleForUser(user.id);
    }
  }

  const target = popup
    ? `${appUrl}/auth/complete`
    : createdNew
      ? `${appUrl}/bienvenue`
      : `${appUrl}/`;
  const userAgent = req.headers.get("user-agent") ?? null;
  const res = NextResponse.redirect(target, 302);
  res.cookies.delete(STATE_COOKIE);
  await setSessionCookie(res, user.id, { userAgent, ipHash: null });
  return res;
}
