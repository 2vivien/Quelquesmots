import { test, expect } from "@playwright/test";
import { cleanupE2eTestData, createPublishedPost, pool, signInMockUser, uniqueTag } from "./helpers";

/** Regroupement des LIKE : un seul événement par texte et par fenêtre d'1 h. */
test.afterAll(async () => {
  await cleanupE2eTestData();
});

test("3 likes → 1 notification groupée ; après 1 h → nouvelle notification", async ({ request }) => {
  const author = await signInMockUser(request, uniqueTag("group-a-"));
  const readers = [
    await signInMockUser(request, uniqueTag("group-r1-")),
    await signInMockUser(request, uniqueTag("group-r2-")),
    await signInMockUser(request, uniqueTag("group-r3-")),
    await signInMockUser(request, uniqueTag("group-r4-")),
  ];
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  for (const reader of readers.slice(0, 3)) {
    const res = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
    expect(res.ok()).toBe(true);
  }

  const list = async () => {
    const res = await request.get("/api/notifications", { headers: { cookie: author.sessionCookie } });
    expect(res.ok()).toBe(true);
    return ((await res.json()) as { items: Array<{ type: string; postId: string; actorIds: string[] }> }).items;
  };
  const likes = (await list()).filter((item) => item.type === "LIKE" && item.postId === postId);
  expect(likes, "une seule notification LIKE pour 3 acteurs").toHaveLength(1);
  expect(likes[0]!.actorIds, "les 3 acteurs sont conservés").toHaveLength(3);

  const countRes = await request.get("/api/notifications/unread-count", { headers: { cookie: author.sessionCookie } });
  expect(((await countRes.json()) as { count: number }).count).toBe(1);

  // Simule une fenêtre d'1 h écoulée : le like suivant crée une nouvelle entrée.
  await pool.query(
    `update notifications set created_at = now() - interval '2 hours'
     where user_id = (select id from users where email = $1)`,
    [author.email],
  );
  const fourth = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: readers[3]!.sessionCookie } });
  expect(fourth.ok()).toBe(true);
  const afterWindow = (await list()).filter((item) => item.type === "LIKE" && item.postId === postId);
  expect(afterWindow, "nouvelle notification après la fenêtre").toHaveLength(2);
  expect(afterWindow.some((item) => item.actorIds.length === 1)).toBe(true);
});
