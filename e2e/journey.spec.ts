import { test, expect } from "@playwright/test";

/**
 * Parcours public de Quelquesmots sur la branche Neon de l'app.
 * Suppose qu'au moins un texte est publié (contenu réel de la base — adapter si la base est remise à zéro).
 */

test("l'accueil affiche le fil avec au moins un texte publié", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('a[href^="/mots/"]');
  await expect(links.first()).toBeVisible({ timeout: 30_000 });
  expect(await links.count()).toBeGreaterThan(0);
});

test("la page d'un texte publié s'ouvre et affiche le contenu", async ({ page }) => {
  await page.goto("/");
  const first = page.locator('a[href^="/mots/"]').first();
  const href = await first.getAttribute("href");
  expect(href).toMatch(/^\/mots\//);
  await page.goto(href!);
  await expect(page.locator("main, article").first()).toBeVisible({ timeout: 30_000 });
});

test("la recherche plein-texte retrouve le texte publié", async ({ page }) => {
  await page.goto("/recherche?q=calme");
  await expect(page.getByRole("searchbox", { name: "Rechercher un mot, un thème, un auteur…" })).toBeVisible();
  // Le backfill FTS (index posts_fts_fr) doit remonter "Un dimanche au bord de la rivière".
  await expect(page.locator('a[href^="/mots/"]').first()).toBeVisible({ timeout: 30_000 });
});

test("l'API de recherche renvoie des résultats FTS", async ({ request }) => {
  const res = await request.get("/api/search?q=calme&tab=posts");
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { items: Array<{ kind: string }> };
  expect(body.items.length).toBeGreaterThan(0);
  expect(body.items.every((item) => item.kind === "post")).toBe(true);
});

test("le catalogue des thèmes expose les 55 thèmes éditoriaux", async ({ page }) => {
  await page.goto("/themes");
  await expect(page.getByRole("heading", { name: /Tous les thèmes/i })).toBeVisible({ timeout: 30_000 });
  expect(await page.locator('a[href^="/themes/"]').count()).toBeGreaterThanOrEqual(55);
});

test("une page thème s'ouvre depuis le catalogue", async ({ page }) => {
  await page.goto("/themes/theme-espoir");
  await expect(page.locator("main, article").first()).toBeVisible({ timeout: 30_000 });
});

test("une page tag approuvée répond (id UUID)", async ({ page, request }) => {
  const res = await request.get("/api/tags");
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { tags: Array<{ id: string; label: string }> };
  const tag = body.tags.find((t) => t.label === "resilience") ?? body.tags[0];
  expect(tag, "au moins un tag approuvé attendu").toBeTruthy();
  const pageRes = await page.goto(`/tags/${tag!.id}`);
  expect(pageRes?.status()).toBeLessThan(400);
  await expect(page.locator("main, article").first()).toBeVisible();
});

test("le sitemap liste les URLs publiques", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.ok()).toBe(true);
  const xml = await res.text();
  expect(xml).toContain("/mots/");
  expect(xml).toContain("/themes/");
});

test("l'API de feed renvoie des items JSON", async ({ request }) => {
  const res = await request.get("/api/posts?limit=5");
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { items: unknown[]; nextCursor: string | null };
  expect(Array.isArray(body.items)).toBe(true);
});
