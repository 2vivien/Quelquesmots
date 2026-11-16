import { test, expect, request as playwrightRequest } from "@playwright/test";
import {
  cleanupE2eTestData,
  createPublishedPost,
  fetchThemeIds,
  signInMockUser,
  uniqueTag,
} from "./helpers";

/**
 * Studio : brouillons, publication, visibilité, suppression.
 * Utilise le bouchon Google local ; les fixtures sont assainies en fin de run.
 */

test.afterAll(async () => {
  await cleanupE2eTestData();
});

test("publier un texte via le Studio → il apparaît dans le fil SSR (page d'accueil)", async ({ request, page }) => {
  const tag = uniqueTag("form-");
  const { sessionCookie } = await signInMockUser(request, tag);
  const { postId, title } = await createPublishedPost(request, sessionCookie, { visibility: "PUBLIC" });

  await page.goto("/", { waitUntil: "networkidle", timeout: 60_000 });
  await expect(page.locator(`a[href="/mots/${postId}"]`).first()).toBeVisible({ timeout: 30_000 });
});

test("un texte privé est 404 pour un invité, 200 pour son auteur", async ({ request }, testInfo) => {
  const baseURL = (testInfo.project.use as { baseURL?: string }).baseURL ?? "http://localhost:3000";
  const tag = uniqueTag("prive-");
  const { sessionCookie } = await signInMockUser(request, tag);
  const { postId, title } = await createPublishedPost(request, sessionCookie, { visibility: "PRIVATE" });

  // Contexte indépendant, sans aucun cookie : un vrai invité.
  // (L'app rend notFound() inline avec un statut 200 à cause du streaming du shell — loading.tsx —
  //  on vérifie donc le rendu, pas le statut HTTP. La donnée privée n'est JAMAIS exposée ici.)
  const anon = await playwrightRequest.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const anonRes = await anon.get(`/mots/${postId}`);
  const anonBody = await anonRes.text();
  expect(anonBody).toContain("Texte introuvable");
  expect(anonBody).not.toContain(title);
  await anon.dispose();

  const owner = await request.get(`/mots/${postId}`, { headers: { cookie: sessionCookie } });
  expect(owner.status()).toBe(200);
  expect(await owner.text()).toContain(title);
});

test("la publication est refusée sans thème (au moins 1 requis)", async ({ request }) => {
  const tag = uniqueTag("theme-");
  const { sessionCookie } = await signInMockUser(request, tag);
  await fetchThemeIds(request); // garantit des thèmes en base (non utilisés ici)

  const draft = await request.post("/api/studio/drafts", {
    headers: { cookie: sessionCookie },
    data: {
      title: "Brouillon sans thème e2e",
      contentText: "Un texte suffisamment long pour dépasser la limite minimale de publication, et qui ne recevra jamais de thème.",
      themeIds: [],
    },
  });
  expect(draft.ok()).toBe(true);
  const { draft: saved } = (await draft.json()) as { draft: { id: string } };

  const published = await request.post(`/api/studio/publish/${saved.id}`, {
    headers: { cookie: sessionCookie },
  });
  expect(published.status()).toBe(400);
  expect(await published.text()).toContain("thème");
});

test("la publication est refusée si le texte est trop court", async ({ request }) => {
  const tag = uniqueTag("court-");
  const { sessionCookie } = await signInMockUser(request, tag);
  const themeIds = [(await fetchThemeIds(request))[0]!];

  const draft = await request.post("/api/studio/drafts", {
    headers: { cookie: sessionCookie },
    data: { title: "Brouillon court e2e", contentText: "b", themeIds },
  });
  expect(draft.ok()).toBe(true);
  const { draft: saved } = (await draft.json()) as { draft: { id: string } };

  const published = await request.post(`/api/studio/publish/${saved.id}`, {
    headers: { cookie: sessionCookie },
  });
  expect(published.status()).toBe(400);
});

test("suppression d'un brouillon : il n'apparaît plus dans la liste", async ({ request }) => {
  const tag = uniqueTag("suppr-");
  const { sessionCookie } = await signInMockUser(request, tag);
  const themeIds = [(await fetchThemeIds(request))[0]!];

  const draft = await request.post("/api/studio/drafts", {
    headers: { cookie: sessionCookie },
    data: {
      title: "Brouillon à supprimer e2e",
      contentText: "Ce brouillon sera supprimé par le test et ne doit plus apparaître nulle part.",
      themeIds,
    },
  });
  expect(draft.ok()).toBe(true);
  const { draft: saved } = (await draft.json()) as { draft: { id: string } };

  const deleted = await request.delete(`/api/studio/drafts/${saved.id}`, {
    headers: { cookie: sessionCookie },
  });
  expect(deleted.ok()).toBe(true);

  const list = await request.get("/api/studio/drafts", { headers: { cookie: sessionCookie } });
  expect(list.ok()).toBe(true);
  const body = (await list.json()) as { drafts: Array<{ id: string }> };
  expect(body.drafts.some((d) => d.id === saved.id)).toBe(false);
});
