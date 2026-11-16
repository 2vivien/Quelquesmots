import { test, expect } from "@playwright/test";
import { cleanupE2eTestData, signInMockUser, uniqueTag } from "./helpers";

/**
 * Utilisateurs : inscription via bouchon Google, session, onboarding, annuaire, pseudonyme unique.
 */

test.afterAll(async () => {
  await cleanupE2eTestData();
});

test("inscription → session persistée → onboarding (pseudonyme + onboarded)", async ({ request }) => {
  const tag = uniqueTag("onboard-");
  const { sessionCookie } = await signInMockUser(request, tag);

  const before = await request.get("/api/auth/session", { headers: { cookie: sessionCookie } });
  expect(before.ok()).toBe(true);
  const beforeBody = (await before.json()) as { user: { onboarded: boolean; username: string } | null };
  expect(beforeBody.user).toBeTruthy();
  expect(beforeBody.user!.onboarded).toBe(false);
  expect(beforeBody.user!.username).toMatch(/^plume-[0-9a-f]{8}$/);

  const username = `e2eprofil${Date.now().toString(36)}`;
  const patch = await request.patch("/api/settings/profile", {
    headers: { cookie: sessionCookie },
    data: { username, onboarded: true, firstName: "E2E", lastName: "Testeur", listedInDirectory: true },
  });
  expect(patch.ok(), `profil : ${patch.status()} ${await patch.text()}`).toBe(true);
  const patchBody = (await patch.json()) as { user: { username: string; onboarded: boolean } };
  expect(patchBody.user.username).toBe(username);
  expect(patchBody.user.onboarded).toBe(true);

  const after = await request.get("/api/auth/session", { headers: { cookie: sessionCookie } });
  const afterBody = (await after.json()) as { user: { username: string; onboarded: boolean } };
  expect(afterBody.user.username).toBe(username);
  expect(afterBody.user.onboarded).toBe(true);
});

test("l'auteur complété apparaît dans l'annuaire public des auteurs", async ({ request }) => {
  const tag = uniqueTag("annuaire-");
  const { sessionCookie } = await signInMockUser(request, tag);
  const username = `e2eanuaire${Date.now().toString(36)}`;

  const patch = await request.patch("/api/settings/profile", {
    headers: { cookie: sessionCookie },
    data: { username, listedInDirectory: true },
  });
  expect(patch.ok()).toBe(true);

  const res = await request.get(`/api/authors?q=${encodeURIComponent(username)}`);
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { authors: Array<{ username: string }> };
  expect(body.authors.some((a) => a.username === username)).toBe(true);
});

test("un pseudonyme déjà pris est refusé (400)", async ({ request }) => {
  const tag1 = uniqueTag("premier-");
  const tag2 = uniqueTag("second-");
  const first = await signInMockUser(request, tag1);
  const username = `e2edoublon${Date.now().toString(36)}`;

  const claim = await request.patch("/api/settings/profile", {
    headers: { cookie: first.sessionCookie },
    data: { username },
  });
  expect(claim.ok()).toBe(true);

  const second = await signInMockUser(request, tag2);
  const duplicate = await request.patch("/api/settings/profile", {
    headers: { cookie: second.sessionCookie },
    data: { username },
  });
  expect(duplicate.status()).toBe(400);
});

test("un invité non connecté ne peut pas créer de brouillon (401)", async ({ request }) => {
  const res = await request.post("/api/studio/drafts", { data: { title: "Non autorisé e2e" } });
  expect(res.status()).toBe(401);
});
