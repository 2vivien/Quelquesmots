import { test, expect, type APIRequestContext } from "@playwright/test";
import { cleanupE2eTestData, createPublishedPost, pool, signInMockUser, uniqueTag } from "./helpers";

/**
 * Système de notifications : compteur non lu, anti-doublon, marquage lu,
 * événements LIKE sur texte/commentaire, REPLY et FOLLOW, et ciblage du commentaire.
 * Deux comptes distincts par scénario (jamais de notification à soi-même).
 */
test.afterAll(async () => {
  await cleanupE2eTestData();
});

interface NotificationItem {
  id: string;
  type: string;
  postId: string;
  commentId: string | null;
  read: boolean;
}

async function unreadCount(request: APIRequestContext, cookie: string): Promise<number> {
  const res = await request.get("/api/notifications/unread-count", { headers: { cookie } });
  expect(res.ok(), `compteur : ${res.status()} ${await res.text()}`).toBe(true);
  const body = (await res.json()) as { count: number };
  return body.count;
}

async function notificationList(request: APIRequestContext, cookie: string): Promise<NotificationItem[]> {
  const res = await request.get("/api/notifications", { headers: { cookie } });
  expect(res.ok(), `liste : ${res.status()}`).toBe(true);
  return ((await res.json()) as { items: NotificationItem[] }).items;
}

async function markRead(request: APIRequestContext, cookie: string, ids: string[]): Promise<void> {
  const res = await request.post("/api/notifications/read", { headers: { cookie }, data: { ids } });
  expect(res.ok(), `marquage lu : ${res.status()}`).toBe(true);
}

async function userIdFor(email: string): Promise<string> {
  const rows = (await pool.query<{ id: string }>("select id from users where email = $1", [email])).rows;
  expect(rows.length, `utilisateur ${email} introuvable`).toBe(1);
  return rows[0]!.id;
}

test("compteur non lu : like → +1, marquage lu → 0, retrait/remise → pas de doublon, jamais à soi-même", async ({ request }) => {
  const author = await signInMockUser(request, uniqueTag("notif-count-a-"));
  const reader = await signInMockUser(request, uniqueTag("notif-count-r-"));
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  expect(await unreadCount(request, author.sessionCookie)).toBe(0);

  const like = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  expect(like.ok()).toBe(true);
  expect(await unreadCount(request, author.sessionCookie)).toBe(1);

  const items = await notificationList(request, author.sessionCookie);
  const likeNotif = items.find((item) => item.type === "LIKE" && item.postId === postId);
  expect(likeNotif, "notification LIKE attendue").toBeTruthy();
  expect(likeNotif!.read).toBe(false);

  // Retrait puis remise : l'événement déjà enregistré est réactivé, pas dupliqué.
  await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  expect(await unreadCount(request, author.sessionCookie)).toBe(1);
  expect((await notificationList(request, author.sessionCookie)).filter((i) => i.type === "LIKE" && i.postId === postId)).toHaveLength(1);

  // Marquage individuel puis global.
  await markRead(request, author.sessionCookie, [likeNotif!.id]);
  expect(await unreadCount(request, author.sessionCookie)).toBe(0);
  expect((await notificationList(request, author.sessionCookie)).find((i) => i.id === likeNotif!.id)!.read).toBe(true);

  // Nouvelle activité après lecture : retrait puis remise réactive la notification.
  await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  const reLike = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  expect(reLike.ok()).toBe(true);
  expect(await unreadCount(request, author.sessionCookie)).toBe(1);
  const allUnread = (await notificationList(request, author.sessionCookie)).filter((i) => !i.read).map((i) => i.id);
  await markRead(request, author.sessionCookie, allUnread);
  expect(await unreadCount(request, author.sessionCookie)).toBe(0);

  // Aucune notification pour son propre like.
  const selfLike = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: author.sessionCookie } });
  expect(selfLike.ok()).toBe(true);
  expect(await unreadCount(request, author.sessionCookie)).toBe(0);
});

test("COMMENT / REPLY / COMMENT_LIKE / FOLLOW : destinataire, types et commentId", async ({ request }) => {
  const author = await signInMockUser(request, uniqueTag("notif-kind-a-"));
  const reader = await signInMockUser(request, uniqueTag("notif-kind-r-"));
  const authorId = await userIdFor(author.email);
  const readerId = await userIdFor(reader.email);
  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  const comment = await request.post(`/api/posts/${postId}/comments`, {
    headers: { cookie: reader.sessionCookie },
    data: { body: "Un commentaire pour tester les notifications." },
  });
  expect(comment.ok()).toBe(true);
  const commentId = ((await comment.json()) as { comment: { id: string } }).comment.id;

  const authorItems = await notificationList(request, author.sessionCookie);
  const commentNotif = authorItems.find((i) => i.type === "COMMENT" && i.postId === postId);
  expect(commentNotif, "notification COMMENT attendue").toBeTruthy();
  expect(commentNotif!.commentId).toBe(commentId);

  const reply = await request.post(`/api/posts/${postId}/comments`, {
    headers: { cookie: author.sessionCookie },
    data: { body: "Une réponse ciblée.", parentId: commentId },
  });
  expect(reply.ok()).toBe(true);
  const replyId = ((await reply.json()) as { comment: { id: string } }).comment.id;
  const readerItems = await notificationList(request, reader.sessionCookie);
  const replyNotif = readerItems.find((i) => i.type === "REPLY" && i.postId === postId);
  expect(replyNotif, "notification REPLY attendue").toBeTruthy();
  expect(replyNotif!.commentId).toBe(replyId);

  const commentLike = await request.post(`/api/comments/${commentId}/like`, { headers: { cookie: author.sessionCookie } });
  expect(commentLike.ok()).toBe(true);
  const afterLike = await notificationList(request, reader.sessionCookie);
  const commentLikeNotif = afterLike.find((i) => i.type === "COMMENT_LIKE" && i.commentId === commentId);
  expect(commentLikeNotif, "notification COMMENT_LIKE attendue").toBeTruthy();

  const follow = await request.post(`/api/users/${authorId}/follow`, { headers: { cookie: reader.sessionCookie } });
  expect(follow.ok()).toBe(true);
  const afterFollow = await notificationList(request, author.sessionCookie);
  expect(afterFollow.some((i) => i.type === "FOLLOW"), "notification FOLLOW attendue").toBe(true);

  // L'acteur ne reçoit pas ses propres notifications de like/follow.
  expect((await notificationList(request, author.sessionCookie)).some((i) => i.type === "COMMENT_LIKE")).toBe(false);
  expect((await notificationList(request, reader.sessionCookie)).some((i) => i.type === "FOLLOW")).toBe(false);
  expect(readerId).not.toBe(authorId);
});
