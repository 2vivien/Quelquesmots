import "dotenv/config";
import { test, expect } from "@playwright/test";
import { Pool } from "@neondatabase/serverless";

/**
 * Parcours d'authentification Google complet contre un bouchon local (jamais de compte
 * Google réel ni d'appel sortant) : signin → callback → session → déconnexion.
 * Le compte de test est supprimé après le test (cascade sur profil/session/oauth).
 */

const pool = new Pool({ connectionString: process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL });
const TEST_EMAIL = "e2e.test@example.com";

async function deleteTestUser(): Promise<void> {
  await pool.query("delete from users where email = $1", [TEST_EMAIL]);
}

test.beforeEach(async () => {
  await deleteTestUser();
});

test.afterEach(async () => {
  await deleteTestUser();
});

test("OAuth Google → session persistée → déconnexion sans compte réel", async ({ request }) => {
  // 1) Le signin pose le cookie d'état et redirige vers Google.
  const signin = await request.get("/api/auth/signin/google", { maxRedirects: 0 });
  expect(signin.status()).toBe(302);
  const signinCookies = signin.headers()["set-cookie"] ?? "";
  const stateMatch = signinCookies.match(/qm_oauth_state=([^;]+)/);
  expect(stateMatch, "cookie qm_oauth_state attendu").toBeTruthy();
  const state = decodeURIComponent(stateMatch![1]!);
  expect(signin.headers()["location"]).toContain("accounts.google.com");
  expect(signin.headers()["location"]).toContain(`state=${state}`);

  // 2) Le callback échange le code via le bouchon local et ouvre la session.
  const callback = await request.get(`/api/auth/callback/google?code=mock-e2e-code&state=${state}`, {
    maxRedirects: 0,
    headers: { cookie: `qm_oauth_state=${state}` },
  });
  expect(callback.status()).toBe(302);
  expect(callback.headers()["location"]).toContain("/bienvenue");
  const callbackCookies = callback.headers()["set-cookie"] ?? "";
  const sessionMatch = callbackCookies.match(/qm_session=([^;]+)/);
  expect(sessionMatch, "cookie qm_session attendu").toBeTruthy();
  const sessionCookie = `qm_session=${sessionMatch![1]!}`;

  // 3) La session résout l'utilisateur (création sur première connexion).
  const sessionRes = await request.get("/api/auth/session", { headers: { cookie: sessionCookie } });
  expect(sessionRes.ok()).toBe(true);
  const sessionBody = (await sessionRes.json()) as { user: { id: string; username: string; onboarded: boolean } | null };
  expect(sessionBody.user).toBeTruthy();
  expect(sessionBody.user!.username).toMatch(/^plume-[0-9a-f]{8}$/);
  expect(sessionBody.user!.onboarded).toBe(false);

  // 4) Déconnexion : le jeton est révoqué côté serveur.
  const signout = await request.post("/api/auth/signout", { headers: { cookie: sessionCookie } });
  expect(signout.ok()).toBe(true);
  const afterSignout = await request.get("/api/auth/session", { headers: { cookie: sessionCookie } });
  const afterBody = (await afterSignout.json()) as { user: unknown | null };
  expect(afterBody.user).toBeNull();
});

test.afterAll(async () => {
  await pool.end();
});
