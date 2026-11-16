import { test, expect, type APIRequestContext } from "@playwright/test";
import { cleanupE2eTestData, createPublishedPost, signInMockUser, uniqueTag } from "./helpers";

/**
 * Interactions en transactions : likes, dislikes, favoris, commentaires (+ masquage), vues, notifications.
 * Deux utilisateurs distincts (auteur / lecteur) créés à chaque exécution.
 */

test.afterAll(async () => {
  await cleanupE2eTestData();
});

async function fetchPost(request: APIRequestContext, postId: string) {
  const res = await request.get(`/api/posts/by-id/${postId}`);
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as {
    post: { likeCount: number; dislikeCount: number; bookmarkCount: number; commentCount: number } | null;
  };
  expect(body.post, "texte publié introuvable").toBeTruthy();
  return body.post!;
}

test("like → contraire dislike → retour (transaction) ; favoris ; commentaires ; vues ; notifications", async ({ request }) => {
  const authorTag = uniqueTag("auteur-");
  const readerTag = uniqueTag("lecteur-");
  const author = await signInMockUser(request, authorTag);
  const reader = await signInMockUser(request, readerTag);

  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  // --- Like / unlike ---
  const like1 = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  expect(like1.ok()).toBe(true);
  expect(((await like1.json()) as { liked: boolean }).liked).toBe(true);
  expect((await fetchPost(request, postId)).likeCount).toBe(1);

  const like2 = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  expect(((await like2.json()) as { liked: boolean }).liked).toBe(false);
  expect((await fetchPost(request, postId)).likeCount).toBe(0);

  // --- Like puis switch vers dislike (la réaction précédente est retirée) ---
  await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  const dislike = await request.post(`/api/posts/${postId}/dislike`, { headers: { cookie: reader.sessionCookie } });
  expect(((await dislike.json()) as { disliked: boolean }).disliked).toBe(true);
  let post = await fetchPost(request, postId);
  expect(post.likeCount).toBe(0);
  expect(post.dislikeCount).toBe(1);

  // --- Favori ---
  const bookmark = await request.post(`/api/posts/${postId}/bookmark`, { headers: { cookie: reader.sessionCookie } });
  expect(((await bookmark.json()) as { bookmarked: boolean }).bookmarked).toBe(true);
  post = await fetchPost(request, postId);
  expect(post.bookmarkCount).toBe(1);
  const state = await request.get("/api/interactions/state", { headers: { cookie: reader.sessionCookie } });
  const stateBody = (await state.json()) as { bookmarkedIds: string[] };
  expect(stateBody.bookmarkedIds).toContain(postId);

  // --- Commentaire → notification COMMENT pour l'auteur, réponse → notification REPLY pour le lecteur ---
  const comment = await request.post(`/api/posts/${postId}/comments`, {
    headers: { cookie: reader.sessionCookie },
    data: { body: "Superbe texte, bravo !" },
  });
  expect(comment.ok(), `commentaire : ${comment.status()}`).toBe(true);
  post = await fetchPost(request, postId);
  expect(post.commentCount).toBe(1);

  const authorNotifs = await request.get("/api/notifications", { headers: { cookie: author.sessionCookie } });
  expect(authorNotifs.ok()).toBe(true);
  const authorItems = ((await authorNotifs.json()) as { items: Array<{ type: string }> }).items;
  expect(authorItems.some((item) => item.type === "COMMENT")).toBe(true);

  const commentsBody = (await (await request.get(`/api/posts/${postId}/comments`)).json()) as {
    comments: Array<{ id: string }>;
  };
  const commentId = commentsBody.comments[0]!.id;

  const reply = await request.post(`/api/posts/${postId}/comments`, {
    headers: { cookie: author.sessionCookie },
    data: { body: "Merci beaucoup !", parentId: commentId },
  });
  expect(reply.ok()).toBe(true);

  const readerNotifs = await request.get("/api/notifications", { headers: { cookie: reader.sessionCookie } });
  const readerItems = ((await readerNotifs.json()) as { items: Array<{ type: string }> }).items;
  expect(readerItems.some((item) => item.type === "REPLY")).toBe(true);

  // --- Vues : dédoublonnage 90 s sur la même clé ---
  const view1 = await request.post(`/api/posts/${postId}/view`, {
    headers: { "user-agent": "Mozilla/5.0 (e2e)" },
  });
  expect(view1.ok()).toBe(true);
  expect(((await view1.json()) as { counted: boolean }).counted).toBe(true);
  const view2 = await request.post(`/api/posts/${postId}/view`, {
    headers: { "user-agent": "Mozilla/5.0 (e2e)" },
  });
  expect(((await view2.json()) as { counted: boolean }).counted).toBe(false);

  // --- Masquage par l'auteur du commentaire : le compteur décrémente ---
  const hide = await request.post(`/api/comments/${commentId}/hide`, { headers: { cookie: reader.sessionCookie } });
  expect(hide.ok()).toBe(true);
  post = await fetchPost(request, postId);
  expect(post.commentCount).toBe(1); // la réponse de l'auteur est toujours visible
});

test("notifications LIKE : l'auteur est notifié quand un lecteur aime son texte", async ({ request }) => {
  const authorTag = uniqueTag("notif-auteur-");
  const readerTag = uniqueTag("notif-lecteur-");
  const author = await signInMockUser(request, authorTag);
  const reader = await signInMockUser(request, readerTag);

  const { postId } = await createPublishedPost(request, author.sessionCookie, { visibility: "PUBLIC" });

  const like = await request.post(`/api/posts/${postId}/like`, { headers: { cookie: reader.sessionCookie } });
  expect(like.ok()).toBe(true);

  const notifs = await request.get("/api/notifications", { headers: { cookie: author.sessionCookie } });
  expect(notifs.ok()).toBe(true);
  const items = ((await notifs.json()) as { items: Array<{ type: string }> }).items;
  expect(items.some((item) => item.type === "LIKE")).toBe(true);
});
