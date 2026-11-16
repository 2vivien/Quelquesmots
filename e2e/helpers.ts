/**
 * Helpers partagés des parcours e2e Quelquesmots.
 * Tous les comptes créés ici vivent en base de test (scénario mock-google)
 * et sont supprimés en cascade par `cleanupE2eTestData()`.
 */
import "dotenv/config";
import { expect, type APIRequestContext } from "@playwright/test";
import { Pool } from "@neondatabase/serverless";

export const pool = new Pool({ connectionString: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL });

/** Préfixe des emails de test ; le nettoyage supprime tout ce qui commence par `e2e`. */
const E2E_EMAILS = "'e2e.test@example.com'";
const E2E_LIKE = "e2e%@example.com";

/** Tag unique et court (compatible avec le format `mock-e2e-<tag>`). */
export function uniqueTag(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET /api/auth/signin/google avec retry sur le rate limit `signin:<ip>` (10/min partagé entre tests). */
export async function signInGoogleWithRetry(request: APIRequestContext) {
  let signin = await request.get("/api/auth/signin/google", { maxRedirects: 0 });
  for (let attempt = 0; attempt < 4 && signin.status() === 429; attempt += 1) {
    await sleep(15_000);
    signin = await request.get("/api/auth/signin/google", { maxRedirects: 0 });
  }
  return signin;
}

/** Sign-in complet via le bouchon Google local → renvoie le cookie de session.
 *  Le limiter `signin:<ip>` (10/min) partagé par tout le worker est respecté par retry avec attente. */
export async function signInMockUser(
  request: APIRequestContext,
  tag: string,
): Promise<{ email: string; sessionCookie: string }> {
  const code = `mock-e2e-${tag}`;
  const email = `e2e-${tag}@example.com`;

  let signin = await signInGoogleWithRetry(request);
  expect(signin.status(), "sign-in Google attendu (302)").toBe(302);
  const setCookieHeader = signin.headers()["set-cookie"] ?? "";
  const stateMatch = setCookieHeader.match(/qm_oauth_state=([^;]+)/);
  expect(stateMatch, "cookie qm_oauth_state attendu").toBeTruthy();
  const state = decodeURIComponent(stateMatch![1]!);

  const callback = await request.get(
    `/api/auth/callback/google?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    { maxRedirects: 0, headers: { cookie: `qm_oauth_state=${state}` } },
  );
  expect(callback.status()).toBe(302);
  expect(callback.headers()["location"]).toContain("/bienvenue");
  const callbackSetCookie = callback.headers()["set-cookie"] ?? "";
  const sessionMatch = callbackSetCookie.match(/qm_session=([^;]+)/);
  expect(sessionMatch, "cookie qm_session attendu").toBeTruthy();
  return { email, sessionCookie: `qm_session=${sessionMatch![1]!}` };
}

/** Thèmes réellement présents en base (uuid réutilisables pour les brouillons). */
export async function fetchThemeIds(request: APIRequestContext): Promise<string[]> {
  const res = await request.get("/api/themes");
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { themes: Array<{ id: string }> };
  expect(body.themes.length, "au moins un thème actif attendu").toBeGreaterThan(0);
  return body.themes.map((t) => t.id);
}

export interface PublishedPost {
  postId: string;
  title: string;
}

/** Crée un brouillon puis le publie ; renvoie l'identifiant du texte. */
export async function createPublishedPost(
  request: APIRequestContext,
  sessionCookie: string,
  options: { visibility?: "PUBLIC" | "PRIVATE"; title?: string; body?: string } = {},
): Promise<PublishedPost> {
  const themeIds = [(await fetchThemeIds(request))[0]!];
  const title = options.title ?? `Texte e2e ${uniqueTag("t-")}`;
  const contentText =
    options.body ??
    "Un texte e2e publié par la suite de tests : il raconte un petit voyage entre deux gares, un café froid posé sur une table en cuivre, et le vent qui pousse la poussière vers la voie 3. Rien de spectaculaire, mais c'est exactement ce dont la page a besoin pour s'ouvrir avec une vraie publication.";

  const draft = await request.post("/api/studio/drafts", {
    headers: { cookie: sessionCookie },
    data: {
      title,
      contentText,
      contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: contentText }] }] },
      visibility: options.visibility ?? "PUBLIC",
      themeIds,
      publishAs: "USERNAME",
      commentsEnabled: true,
    },
  });
  expect(draft.ok(), `création du brouillon échouée : ${draft.status()}`).toBe(true);
  const draftBody = (await draft.json()) as { draft: { id: string } };
  const postId = draftBody.draft.id;

  const published = await request.post(`/api/studio/publish/${postId}`, {
    headers: { cookie: sessionCookie },
  });
  expect(published.ok(), `publication échouée : ${published.status()} ${await published.text()}`).toBe(true);
  return { postId, title };
}

/** Supprime tous les utilisateurs e2e et leurs textes (cascade sur commentaires, réactions, favoris, notifications). */
export async function cleanupE2eTestData(): Promise<void> {
  await pool.query(
    `delete from posts where author_id in (select id from users where email like $1 or email = ${E2E_EMAILS})`,
    [E2E_LIKE],
  );
  await pool.query(`delete from users where email like $1 or email = ${E2E_EMAILS}`, [E2E_LIKE]);
}
