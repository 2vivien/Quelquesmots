import { test, expect, request as playwrightRequest, type Page } from "@playwright/test";
import { cleanupE2eTestData, createPublishedPost, signInMockUser, uniqueTag, pool } from "./helpers";

/**
 * Suppression de textes par leur auteur (soft-delete, `status = DELETED`).
 *
 * Couvre : la disparition de l'API + du fil + du rendu public, le statut en base,
 * l'impossibilité de commenter après suppression, l'interdiction pour un tiers,
 * et le parcours UI complet (bouton → confirmation → redirection).
 */

test.afterAll(async () => {
  // Le pool Neon est partagé entre les specs du worker : ne pas le fermer ici.
  await cleanupE2eTestData();
});

async function setSessionCookie(page: Page, baseURL: string | undefined, sessionCookie: string): Promise<void> {
  const url = new URL(baseURL ?? "http://localhost:3000");
  const [, value] = sessionCookie.split("=");
  await page.context().addCookies([{ name: "qm_session", value: value!, domain: url.hostname, path: "/" }]);
}

test("l'auteur supprime son texte publié → invisible partout (API, fil, rendu) + soft-delete en base", async ({ request, page }, testInfo) => {
  const authorTag = uniqueTag("sup-auteur-");
  const { sessionCookie } = await signInMockUser(request, authorTag);
  const { postId } = await createPublishedPost(request, sessionCookie, { visibility: "PUBLIC" });

  // Le texte est bien là avant suppression.
  const before = await request.get(`/api/posts/by-id/${postId}`);
  expect(before.ok()).toBe(true);

  // 1) Suppression par l'auteur.
  const deleted = await request.delete(`/api/studio/drafts/${postId}`, {
    headers: { cookie: sessionCookie },
  });
  expect(deleted.ok()).toBe(true);
  expect(((await deleted.json()) as { ok: boolean }).ok).toBe(true);

  // 2) API : plus accessible (404 dans les deux sens).
  const afterOwner = await request.get(`/api/posts/by-id/${postId}`, { headers: { cookie: sessionCookie } });
  expect(afterOwner.status()).toBe(404);
  const afterAnon = await request.get(`/api/posts/by-id/${postId}`);
  expect(afterAnon.status()).toBe(404);

  // 3) Fil : plus présent.
  const feed = await request.get("/api/posts?limit=50");
  expect(feed.ok()).toBe(true);
  const feedBody = (await feed.json()) as { items: Array<{ id: string }> };
  expect(feedBody.items.some((item) => item.id === postId)).toBe(false);

  // 4) Page publique : rendu « introuvable », contenu non exposé.
  const pageRes = await page.goto(`/mots/${postId}`);
  const body = await page.textContent("body");
  expect(pageRes?.status()).toBeLessThan(500);
  expect(body).toContain("introuvable");

  // 5) Commenter un texte supprimé : refusé.
  const comment = await request.post(`/api/posts/${postId}/comments`, {
    headers: { cookie: sessionCookie },
    data: { body: "Commentaire après suppression ?" },
  });
  expect(comment.status()).toBe(404);

  // 6) Soft-delete : la ligne existe encore, statut DELETED (jamais de hard-delete).
  const row = await pool.query<{ status: string }>("select status from posts where id = $1", [postId]);
  expect(row.rows[0]?.status).toBe("DELETED");

  // 7) La suppression n'est pas un brouillon supprimé mais reste invisible du Studio.
  const studioList = await request.get("/api/studio/drafts", { headers: { cookie: sessionCookie } });
  expect(studioList.ok()).toBe(true);
  const drafts = (await studioList.json()) as { drafts: Array<{ id: string }> };
  expect(drafts.drafts.some((d) => d.id === postId)).toBe(false);
});

test("un autre utilisateur ne peut pas supprimer le texte de l'auteur (404)", async ({ request }) => {
  const authorTag = uniqueTag("sup-auteur2-");
  const intruderTag = uniqueTag("sup-intrus-");
  const author = await signInMockUser(request, authorTag);
  const intruder = await signInMockUser(request, intruderTag);
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  const forbiddenDelete = await request.delete(`/api/studio/drafts/${postId}`, {
    headers: { cookie: intruder.sessionCookie },
  });
  expect(forbiddenDelete.status()).toBe(404);

  // Le texte de l'auteur est toujours lisible.
  const stillThere = await request.get(`/api/posts/by-id/${postId}`, { headers: { cookie: author.sessionCookie } });
  expect(stillThere.ok()).toBe(true);
});

test("parcours UI : bouton « Supprimer ce texte » → confirmation → retour au mur, texte supprimé", async ({ page, request }, testInfo) => {
  const baseURL = (testInfo.project.use as { baseURL?: string }).baseURL ?? "http://localhost:3000";
  const tag = uniqueTag("sup-ui-");
  const { sessionCookie } = await signInMockUser(request, tag);
  const { postId } = await createPublishedPost(request, sessionCookie, { visibility: "PUBLIC" });

  await setSessionCookie(page, baseURL, sessionCookie);
  await page.goto(`/mots/${postId}`);

  // Le bouton propriétaire est visible…
  const deleteButton = page.getByRole("button", { name: "Supprimer ce texte" });
  await expect(deleteButton).toBeVisible({ timeout: 30_000 });

  // …ouvre le dialogue de confirmation…
  await deleteButton.click();
  const dialog = page.getByRole("dialog", { name: "Supprimer ce texte ?" });
  await expect(dialog).toBeVisible();

  // …et confirmer supprime + redirige au mur.
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page).toHaveURL("/");

  const res = await request.get(`/api/posts/by-id/${postId}`, { headers: { cookie: sessionCookie } });
  expect(res.status()).toBe(404);
});

test("parcours UI : le bouton de suppression n'apparaît pas pour un non-propriétaire", async ({ page, request }, testInfo) => {
  const baseURL = (testInfo.project.use as { baseURL?: string }).baseURL ?? "http://localhost:3000";
  const authorTag = uniqueTag("sup-ui-auteur-");
  const viewerTag = uniqueTag("sup-ui-cote-");
  const author = await signInMockUser(request, authorTag);
  const viewer = await signInMockUser(request, viewerTag);
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  await setSessionCookie(page, baseURL, viewer.sessionCookie);
  await page.goto(`/mots/${postId}`);

  await expect(page.getByRole("button", { name: "Supprimer ce texte" })).toHaveCount(0);
});
