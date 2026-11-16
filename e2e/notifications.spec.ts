import { test, expect, type APIRequestContext } from "@playwright/test";
import { cleanupE2eTestData, createPublishedPost, signInMockUser, uniqueTag } from "./helpers";

/**
 * Notifications : événements métier (like groupe, like sur commentaire, follow),
 * compteur non lu, regroupement glissant « X et N autres personnes ont aimé »,
 * marquage comme lu individuel et global.
 */

test.afterAll(async () => {
  // Le pool Neon est partagé entre les specs du worker : ne pas le fermer ici.
  await cleanupE2eTestData();
});

async function unreadCount(request: APIRequestContext, sessionCookie: string): Promise<number> {
  const res = await request.get("/api/notifications/unread-count", { headers: { cookie: sessionCookie } });
  expect(res.ok()).toBe(true);
  return ((await res.json()) as { count: number }).count;
}

async function listNotifications(request: APIRequestContext, sessionCookie: string) {
  const res = await request.get("/api/notifications", { headers: { cookie: sessionCookie } });
  expect(res.ok()).toBe(true);
  return ((await res.json()) as { items: Array<{ id: string; type: string; actorIds: string[]; commentId: string | null; read: boolean }> }).items;
}

test("like regroupé (fenêtre 1 h) : un seul item avec tous les acteurs", async ({ request }) => {
  const authorTag = uniqueTag("notif-groupe-auteur-");
  const author = await signInMockUser(request, authorTag);
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  const readerTags = [uniqueTag("notif-l1-"), uniqueTag("notif-l2-"), uniqueTag("notif-l3-")];
  const readers = await Promise.all(readerTags.map((tag) => signInMockUser(request, tag)));

  for (const reader of readers) {
    const like = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
    expect(like.ok()).toBe(true);
  }

  // Trois likes = une seule notification groupée avec 3 acteurs.
  const items = await listNotifications(request, author.sessionCookie);
  const likeItems = items.filter((item) => item.type === "LIKE");
  expect(likeItems).toHaveLength(1);
  expect(likeItems[0]!.actorIds).toHaveLength(3);
  // Compteur non lu == nombre de lignes non lues (le groupé compte pour 1).
  expect(await unreadCount(request, author.sessionCookie)).toBe(1);

  // Marquage comme lu individuel → compteur à zéro.
  const mark = await request.post("/api/notifications/read", {
    headers: { cookie: author.sessionCookie },
    data: { ids: [likeItems[0]!.id] },
  });
  expect(mark.ok()).toBe(true);
  expect(await unreadCount(request, author.sessionCookie)).toBe(0);
  const after = await listNotifications(request, author.sessionCookie);
  expect(after.find((item) => item.id === likeItems[0]!.id)?.read).toBe(true);
});

test("like sur commentaire → COMMENT_LIKE avec commentId, sans notification pour soi-même", async ({ request }) => {
  const authorTag = uniqueTag("notif-cl-auteur-");
  const commenterTag = uniqueTag("notif-cl-commentateur-");
  const author = await signInMockUser(request, authorTag);
  const commenter = await signInMockUser(request, commenterTag);
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  // Le commentaire (du commentateur) sur le post de l'auteur.
  const comment = await request.post(`/api/posts/${postId}/comments`, {
    headers: { cookie: commenter.sessionCookie },
    data: { body: "Un commentaire e2e à aimer." },
  });
  expect(comment.ok()).toBe(true);
  const commentBody = (await comment.json()) as { comment: { id: string } };
  const commentId = commentBody.comment.id;

  // L'auteur aime le commentaire → notification COMMENT_LIKE chez le commentateur.
  const like = await request.post(`/api/comments/${commentId}/like`, { headers: { cookie: author.sessionCookie } });
  expect(like.ok()).toBe(true);

  const items = await listNotifications(request, commenter.sessionCookie);
  const commentLike = items.find((item) => item.type === "COMMENT_LIKE");
  expect(commentLike, "une notification COMMENT_LIKE attendue").toBeTruthy();
  expect(commentLike!.commentId).toBe(commentId);

  // L'auteur aime son propre commentaire → aucune notification personnelle.
  const ownComment = await request.post(`/api/posts/${postId}/comments`, {
    headers: { cookie: author.sessionCookie },
    data: { body: "Commentaire propre à l'auteur." },
  });
  expect(ownComment.ok()).toBe(true);
  const ownCommentBody = (await ownComment.json()) as { comment: { id: string } };
  const ownCommentLike = await request.post(`/api/comments/${ownCommentBody.comment.id}/like`, {
    headers: { cookie: author.sessionCookie },
  });
  expect(ownCommentLike.ok()).toBe(true);
  const authorItems = await listNotifications(request, author.sessionCookie);
  expect(authorItems.some((item) => item.type === "COMMENT_LIKE")).toBe(false);
});

test("suivre un auteur → FOLLOW ; se suivre soi-même → aucune notification", async ({ request }) => {
  const tag1 = uniqueTag("notif-f1-");
  const tag2 = uniqueTag("notif-f2-");
  const first = await signInMockUser(request, tag1);
  const second = await signInMockUser(request, tag2);

  const meRes = await request.get("/api/auth/session", { headers: { cookie: second.sessionCookie } });
  const meBody = (await meRes.json()) as { user: { id: string } };
  const targetId = meBody.user.id;

  const follow = await request.post(`/api/users/${targetId}/follow`, { headers: { cookie: first.sessionCookie } });
  expect(follow.ok()).toBe(true);

  const secondItems = await listNotifications(request, second.sessionCookie);
  expect(secondItems.some((item) => item.type === "FOLLOW")).toBe(true);

  // Auto-follow impossible : renvoie 400/403 selon l'implémentation.
  const ownRes = await request.get("/api/auth/session", { headers: { cookie: first.sessionCookie } });
  const ownBody = (await ownRes.json()) as { user: { id: string } };
  const selfFollow = await request.post(`/api/users/${ownBody.user.id}/follow`, { headers: { cookie: first.sessionCookie } });
  expect([400, 403, 422]).toContain(selfFollow.status());
});

test("marquage global « Tout marquer lu » via l'API → compteur à zéro", async ({ request }) => {
  const authorTag = uniqueTag("notif-all-auteur-");
  const readerTag = uniqueTag("notif-all-lecteur-");
  const author = await signInMockUser(request, authorTag);
  const reader = await signInMockUser(request, readerTag);
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  const like = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  expect(like.ok()).toBe(true);
  expect(await unreadCount(request, author.sessionCookie)).toBe(1);

  const items = await listNotifications(request, author.sessionCookie);
  const allIds = items.map((item) => item.id);
  const markAll = await request.post("/api/notifications/read", {
    headers: { cookie: author.sessionCookie },
    data: { ids: allIds },
  });
  expect(markAll.ok()).toBe(true);
  expect(await unreadCount(request, author.sessionCookie)).toBe(0);
});

test("un invité sans session reçoit 401 sur les endpoints de notifications", async ({ request }) => {
  const list = await request.get("/api/notifications");
  expect(list.status()).toBe(401);
  const count = await request.get("/api/notifications/unread-count");
  expect(count.status()).toBe(401);
  const read = await request.post("/api/notifications/read", { data: { ids: [] } });
  expect(read.status()).toBe(401);
});
