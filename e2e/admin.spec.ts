import { test, expect, request as playwrightRequest } from "@playwright/test";
import { cleanupE2eTestData, createPublishedPost, signInMockUser, uniqueTag, pool } from "./helpers";

/**
 * Modération & administration : signalement (utilisateur authentifié),
 * autorisation (403 non-admin), masquage par un administrateur, audit.
 */

test.afterAll(async () => {
  // Le pool Neon est partagé entre les specs du worker : ne pas le fermer ici.
  await cleanupE2eTestData();
});

test("un texte signalé par un lecteur est masqué par un admin (403 pour un non-admin)", async ({ request }, testInfo) => {
  const baseURL = (testInfo.project.use as { baseURL?: string }).baseURL ?? "http://localhost:3000";
  const authorTag = uniqueTag("mod-auteur-");
  const reporterTag = uniqueTag("mod-signaleur-");
  const adminTag = uniqueTag("mod-admin-");
  const author = await signInMockUser(request, authorTag);
  const reporter = await signInMockUser(request, reporterTag);
  const admin = await signInMockUser(request, adminTag);

  const { postId, title } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  // 1) Signalement par un lecteur connecté.
  const report = await request.post("/api/reports", {
    headers: { cookie: reporter.sessionCookie },
    data: {
      targetType: "POST",
      targetId: postId,
      targetLabel: title,
      reason: "OTHER",
      details: "Test e2e : contenu à vérifier.",
    },
  });
  expect(report.status()).toBe(201);

  // 2) Un non-admin ne peut pas masquer (403).
  const forbidden = await request.patch(`/api/admin/posts/${postId}`, {
    headers: { cookie: reporter.sessionCookie },
    data: { status: "HIDDEN", locked: true },
  });
  expect(forbidden.status()).toBe(403);

  // 3) Promotion du 3e utilisateur en administrateur (bootstrap interne).
  await pool.query("update users set role = 'admin' where email = $1", [admin.email]);
  // La session existante suffit : le rôle est relu en base à chaque requête.
  const reports = await request.get("/api/admin/reports", { headers: { cookie: admin.sessionCookie } });
  expect(reports.ok()).toBe(true);
  const reportsBody = (await reports.json()) as { reports: Array<{ targetId: string | null; targetLabel?: string }> };
  expect(reportsBody.reports.some((r) => r.targetId === postId)).toBe(true);

  // 4) L'admin masque le texte ; l'invité ne peut plus y accéder.
  const hide = await request.patch(`/api/admin/posts/${postId}`, {
    headers: { cookie: admin.sessionCookie },
    data: { status: "HIDDEN", locked: true },
  });
  expect(hide.ok()).toBe(true);

  const anonContext = await playwrightRequest.newContext({
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  const anon = await anonContext.get(`/api/posts/by-id/${postId}`);
  expect(anon.status()).toBe(404);
  await anonContext.dispose();

  // 5) L'action est tracée dans le journal d'audit.
  const audit = await request.get("/api/admin/audit", { headers: { cookie: admin.sessionCookie } });
  expect(audit.ok()).toBe(true);
  expect(await audit.text()).toContain("HIDE");
});
