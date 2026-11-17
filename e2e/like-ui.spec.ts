import { test, expect, type Page } from "@playwright/test";
import { cleanupE2eTestData, createPublishedPost, signInMockUser, uniqueTag } from "./helpers";

/**
 * Tests navigateur des compteurs de réactions (vérifient l'affichage React,
 * pas seulement les réponses API).
 */

test.afterAll(async () => {
  await cleanupE2eTestData();
});

async function setSession(page: Page, baseURL: string | undefined, sessionCookie: string): Promise<void> {
  const url = new URL(baseURL ?? "http://localhost:3000");
  const [, value] = sessionCookie.split("=");
  await page.context().addCookies([{ name: "qm_session", value: value!, domain: url.hostname, path: "/" }]);
}

test("compteur de likes : +1 après clic, jamais de retour à l'ancien total", async ({ page, request }, testInfo) => {
  const baseURL = (testInfo.project.use as { baseURL?: string }).baseURL;
  const authorTag = uniqueTag("like-ui-auteur-");
  const readerTag = uniqueTag("like-ui-lecteur-");
  const author = await signInMockUser(request, authorTag);
  const reader = await signInMockUser(request, readerTag);
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  await setSession(page, baseURL, reader.sessionCookie);
  await page.goto(`/mots/${postId}`, { waitUntil: "networkidle", timeout: 60_000 });

  const like = page.getByRole("button", { name: /j'aime$/ });
  await expect(like).toBeVisible({ timeout: 30_000 });
  const before = await like.textContent();
  const beforeCount = Number((before ?? "").trim()) || 0;

  const likeResponsePromise = page.waitForResponse((response) => response.url().includes(`/api/posts/${postId}/like`), { timeout: 20_000 });
  await like.click();
  const likeResponse = await likeResponsePromise;
  expect(likeResponse.ok()).toBe(true);
  // Le compteur passe immédiatement à +1 et reste stable après la réponse serveur.
  await expect.poll(async () => Number((await like.textContent() ?? "").trim()) || 0).toBe(beforeCount + 1);
  await page.waitForTimeout(1500);
  expect(Number((await like.textContent() ?? "").trim()) || 0).toBe(beforeCount + 1);
  await expect(like).toHaveAttribute("aria-pressed", "true");

  // Persistance confirmée par une lecture API indépendante.
  const state = await request.get("/api/interactions/state", { headers: { cookie: reader.sessionCookie } });
  const body = (await state.json()) as { likedIds: string[] };
  expect(body.likedIds).toContain(postId);
});
