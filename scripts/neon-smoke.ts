/**
 * Smoke test de bout en bout contre la VRAIE base Neon (jamais une base éphémère).
 * Crée uniquement des lignes marquées `smoke-<ts>`, vérifie les parcours critiques
 * (brouillon → publication, réactions, commentaires, modération, sessions…),
 * puis supprime TOUTES les traces et compare les compteurs avant/après.
 *
 *   DATABASE_URL=… tsx scripts/neon-smoke.ts
 */
import { Pool } from "@neondatabase/serverless";
import { NextRequest } from "next/server";
import {
  addComment, adminModerate, countDraftsByAuthor, createReport, deleteAccount,
  findOrCreateGoogleUser, getPostById, getPostBySlug, getSettings, hideComment, listFeed,
  listNotifications, listReports, publishPost, recordView,
  toggleBookmark, toggleBlockUser, toggleDislike, toggleFollow, toggleLike,
  updateSettings, updateUserProfile, upsertDraft, viewerKeyFromIp,
} from "@/lib/server/repository";
import { SESSION_COOKIE, createSession, deleteSessionsForUser, getSessionUserId } from "@/lib/server/session";

const TS = Date.now().toString(36);
const MARK = `smoke-${TS}`;
const url = process.env.DATABASE_URL ?? process.env.DATABASE_MIGRATION_URL;
if (!url) throw new Error("DATABASE_URL requis (pointer vers la branche Neon de l'app).");
const pool = new Pool({ connectionString: url });

const userIds: string[] = [];
const postIds: string[] = [];
const failures: string[] = [];
let checks = 0;
function assert(name: string, cond: boolean): void {
  checks += 1;
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}`);
  }
}

async function counts(): Promise<Record<string, number>> {
  const q = async (sqlText: string) => (await pool.query(sqlText)).rows[0].c as number;
  return {
    users: await q("select count(*)::int as c from users"),
    author_profiles: await q("select count(*)::int as c from author_profiles"),
    oauth_accounts: await q("select count(*)::int as c from oauth_accounts"),
    sessions: await q("select count(*)::int as c from sessions"),
    posts: await q("select count(*)::int as c from posts"),
    comments: await q("select count(*)::int as c from comments"),
    post_reactions: await q("select count(*)::int as c from post_reactions"),
    post_bookmarks: await q("select count(*)::int as c from post_bookmarks"),
    comment_likes: await q("select count(*)::int as c from comment_likes"),
    user_follows: await q("select count(*)::int as c from user_follows"),
    user_blocks: await q("select count(*)::int as c from user_blocks"),
    notifications: await q("select count(*)::int as c from notifications"),
    reports: await q("select count(*)::int as c from reports"),
    admin_audit: await q("select count(*)::int as c from admin_audit"),
    post_view_dedupe: await q("select count(*)::int as c from post_view_dedupe"),
    site_settings: await q("select count(*)::int as c from site_settings"),
  };
}

async function cleanup(userA: string, userB: string, auditActor: string, removeSiteSettings: boolean): Promise<void> {
  const u = [userA, userB];
  const p = postIds;
  await pool.query("delete from post_view_dedupe where post_id = any($1)", [p]);
  await pool.query("delete from notifications where user_id = any($1) or actor_id = any($1) or post_id = any($2)", [u, p]);
  // L'acteur est capturé AVANT deleteAccount(A), sinon le profil n'existe plus pour le joint.
  await pool.query("delete from admin_audit where actor_username = $1", [auditActor]);
  if (removeSiteSettings) {
    await pool.query("delete from site_settings where id = 1");
  }
  await pool.query("delete from reports where target_id = any($1) or reporter_id = any($2)", [p, u]);
  await pool.query("delete from comment_likes where user_id = any($1) or comment_id in (select id from comments where post_id = any($2))", [u, p]);
  await pool.query("delete from post_reactions where user_id = any($1) or post_id = any($2)", [u, p]);
  await pool.query("delete from post_bookmarks where user_id = any($1) or post_id = any($2)", [u, p]);
  await pool.query("delete from comments where post_id = any($1) or author_id = any($2)", [p, u]);
  await pool.query("delete from post_tags where post_id = any($1)", [p]);
  await pool.query("delete from post_themes where post_id = any($1)", [p]);
  await pool.query("delete from posts where id = any($1)", [p]);
  await pool.query("delete from sessions where user_id = any($1)", [u]);
  await pool.query("delete from oauth_accounts where user_id = any($1)", [u]);
  await pool.query("delete from user_follows where follower_id = any($1) or followed_id = any($1)", [u]);
  await pool.query("delete from user_blocks where blocker_id = any($1) or blocked_id = any($1)", [u]);
  await pool.query("delete from author_profiles where user_id = any($1)", [u]);
  await pool.query("delete from users where id = any($1)", [u]);
}

const before = await counts();
console.log(`Base Neon — compteurs AVANT (${Object.entries(before).map(([k, v]) => `${k}=${v}`).join(" ")})`);

let userA = "", userB = "";
let aUser: { username: string } = { username: "" };
try {
  console.log("\n— Création des comptes smoke (chemin OAuth Google) —");
  const a = await findOrCreateGoogleUser({ googleSub: `${MARK}-a`, email: null, givenName: "Smoke", familyName: "A", avatarUrl: null });
  const b = await findOrCreateGoogleUser({ googleSub: `${MARK}-b`, email: null, givenName: "Smoke", familyName: "B", avatarUrl: null });
  userA = a.user.id; userB = b.user.id;
  aUser = a.user;
  userIds.push(userA, userB);
  assert("compte A créé via findOrCreateGoogleUser", a.createdNew && !!userA);
  assert("compte B créé via findOrCreateGoogleUser", b.createdNew && !!userB);
  const again = await findOrCreateGoogleUser({ googleSub: `${MARK}-a`, email: null, givenName: null, familyName: null, avatarUrl: null });
  assert("findOrCreateGoogleUser est idempotent (sub existant → pas de doublon)", !again.createdNew && again.user.id === userA);
  await updateUserProfile(userA, { onboarded: true });

  console.log("\n— Sessions persistées —");
  const session = await createSession(userA, { userAgent: "neon-smoke", ipHash: null });
  const req = new NextRequest("http://localhost:3000/api/auth/session", { headers: { cookie: `${SESSION_COOKIE}=${session.token}` } });
  assert("createSession + getSessionUserId résolvent l'utilisateur", (await getSessionUserId(req)) === userA);
  await deleteSessionsForUser(userA);
  assert("deleteSessionsForUser révoque le jeton", (await getSessionUserId(req)) === null);

  console.log("\n— Brouillon → publication —");
  const draft = await upsertDraft({
    authorId: userA,
    title: `Texte de vérification ${MARK}`,
    contentText: `Corps du texte de vérification ${MARK}. Assez long pour dépasser les vingt caractères requis.`,
    themeSlugs: ["resilience"],
    tagSlugs: ["resilience"],
  });
  postIds.push(draft.id);
  assert("brouillon créé en DRAFT", draft.status === "DRAFT");
  assert("countDraftsByAuthor == 1", (await countDraftsByAuthor(userA)) === 1);
  const settings = await getSettings();
  const published = await publishPost(draft.id, userA, settings.dailyPublishLimit);
  assert("publishPost publie (pas de retour 'limit')", typeof published === "object" && published.status === "PUBLISHED");
  const slug = typeof published === "object" ? (published.slug ?? "") : "";
  assert("slug généré et unique", slug.length > 0);
  const fetched = await getPostBySlug(slug, userA);
  assert("getPostBySlug retrouve le texte publié", fetched?.id === draft.id);

  console.log("\n— Feed (jointure thème réparée) —");
  const feedTheme = await listFeed({ limit: 10, viewerId: userB, sort: "recent", themeSlug: "resilience" });
  assert("feed filtré par thème contient le texte (régression jointure)", feedTheme.items.some((p) => p.id === draft.id));
  const feedAll = await listFeed({ limit: 10, viewerId: userA, sort: "recent" });
  assert("feed global contient le texte", feedAll.items.some((p) => p.id === draft.id));

  console.log("\n— Réactions et compteurs —");
  const like1 = await toggleLike(userA, draft.id);
  const afterLike = await getPostById(draft.id);
  assert("like posé (compteur à 1)", like1.liked && afterLike?.likeCount === 1);
  const like2 = await toggleLike(userA, draft.id);
  const afterUnlike = await getPostById(draft.id);
  assert("second like retire la réaction (compteur à 0)", !like2.liked && afterUnlike?.likeCount === 0);
  const dislike1 = await toggleDislike(userA, draft.id);
  assert("dislike posé", dislike1.disliked);
  const like3 = await toggleLike(userA, draft.id);
  const afterSwitch = await getPostById(draft.id);
  assert("DISLIKE → LIKE : compteurs like=1 dislike=0", like3.liked && afterSwitch?.likeCount === 1 && afterSwitch?.dislikeCount === 0);

  console.log("\n— Favoris —");
  const b1 = await toggleBookmark(userA, draft.id);
  const b2 = await toggleBookmark(userA, draft.id);
  const afterBookmarks = await getPostById(draft.id);
  assert("favoris on puis off (compteur revenu à 0)", b1.bookmarked && !b2.bookmarked && afterBookmarks?.bookmarkCount === 0);

  console.log("\n— Commentaires, notifications REPLY et masquage idempotent —");
  const commentB = await addComment({ postId: draft.id, author: { ...b.user }, parentId: null, body: `Commentaire de B ${MARK}` });
  assert("commentaire de B créé", commentB.kind === "created");
  const commentBId = commentB.kind === "created" ? commentB.comment.id : "";
  const notifA = await listNotifications(userA);
  assert("A reçoit une notification COMMENT de B", notifA.some((n) => n.type === "COMMENT"));
  const replyA = await addComment({ postId: draft.id, author: { ...a.user }, parentId: commentBId, body: `Réponse de A ${MARK}` });
  assert("réponse de A créée", replyA.kind === "created");
  const notifB = await listNotifications(userB);
  assert("B reçoit une notification REPLY de A", notifB.some((n) => n.type === "REPLY"));
  const badParent = await addComment({ postId: draft.id, author: { ...b.user }, parentId: "com-inexistant", body: "réponse invalide" });
  assert("parent inexistant → invalid-parent", badParent.kind === "invalid-parent");
  const h1 = await hideComment(commentBId, a.user);
  const mid = await getPostById(draft.id);
  const h2 = await hideComment(commentBId, a.user);
  const afterHide = await getPostById(draft.id);
  assert("masquage par l'auteur du texte : ok", h1 === "ok");
  assert("compteur décrémenté une fois (commentCount==1 après 1 masquage)", mid?.commentCount === 1);
  assert("second masquage idempotent (compteur inchangé)", h2 === "ok" && afterHide?.commentCount === 1);

  console.log("\n— Vues dédupliquées —");
  const viewerKey = viewerKeyFromIp("203.0.113.7");
  assert("première vue comptabilisée", (await recordView(draft.id, viewerKey)) === true);
  assert("seconde vue immédiatement dédupliquée", (await recordView(draft.id, viewerKey)) === false);

  console.log("\n— Suivis / blocages —");
  const f1 = await toggleFollow(userA, userB);
  const f2 = await toggleFollow(userA, userB);
  assert("follow puis unfollow", f1.following && !f2.following);
  const bl1 = await toggleBlockUser(userA, userB);
  const bl2 = await toggleBlockUser(userA, userB);
  assert("blocage puis déblocage", bl1.blocked && !bl2.blocked);

  console.log("\n— Modération : signalement, HIDE, audit, RESTORE —");
  const settingsBefore = await getSettings();
  await updateSettings({ ...settingsBefore, dailyPublishLimit: settingsBefore.dailyPublishLimit }, userA);
  const report = await createReport({ reporterId: userB, targetType: "POST", targetId: draft.id, targetLabel: `Texte ${MARK}`, reason: "OTHER", details: "signalement smoke" });
  const reportId = typeof report === "string" ? "" : report.id;
  assert("signalement créé", reportId.length > 0);
  await adminModerate({ actorUsername: a.user.username, reportId, targetId: draft.id, targetLabel: `Texte ${MARK}`, action: "HIDE", reason: "smoke" });
  const hidden = await getPostById(draft.id);
  const reports = await listReports();
  assert("HIDE : texte HIDDEN", hidden?.status === "HIDDEN");
  assert("HIDE : signalement RESOLVED", reports.find((r) => r.id === reportId)?.status === "RESOLVED");
  await adminModerate({ actorUsername: a.user.username, reportId, targetId: draft.id, targetLabel: `Texte ${MARK}`, action: "RESTORE", reason: "smoke" });
  const restored = await getPostById(draft.id);
  assert("RESTORE : texte PUBLISHED", restored?.status === "PUBLISHED");
  const auditRows = (await pool.query("select count(*)::int as c from admin_audit where actor_username = $1", [a.user.username])).rows[0].c;
  assert("audit écrit pour HIDE et RESTORE (2 lignes)", auditRows >= 2);

  console.log("\n— Suppression de compte (transaction + cascade) —");
  await deleteAccount(userB);
  const bGone = (await pool.query("select count(*)::int as c from users where id = $1", [userB])).rows[0].c;
  assert("utilisateur B supprimé", bGone === 0);
  const notifBCount = (await pool.query("select count(*)::int as c from notifications where user_id = $1", [userB])).rows[0].c;
  assert("notifications de B cascadées", notifBCount === 0);
  await deleteAccount(userA);
  const aPost = await getPostById(draft.id);
  assert("utilisateur A supprimé, texte marqué DELETED", aPost?.status === "DELETED");
} catch (error) {
  failures.push(`exception: ${(error as Error).message}`);
  console.error("\nEXCEPTION:", error);
} finally {
  if (userA || userB) {
    console.log("\n— Nettoyage des lignes smoke —");
    await cleanup(userA, userB, aUser.username, before.site_settings === 0);
  }
  const after = await counts();
  const drift = Object.entries(before).filter(([k, v]) => after[k] !== v);
  console.log(`\nCompteurs APRÈS : ${Object.entries(after).map(([k, v]) => `${k}=${v}`).join(" ")}`);
  if (drift.length > 0) {
    failures.push(`dérive de compteurs: ${drift.map(([k, v]) => `${k} ${v}→${after[k]}`).join(", ")}`);
  } else {
    console.log("Compteurs identiques à l'état initial : aucune trace smoke restante.");
  }
  await pool.end();
}

console.log(`\n${checks} vérifications, ${failures.length} échec(s)`);
if (failures.length > 0) {
  console.error("ÉCHECS:\n - " + failures.join("\n - "));
  process.exit(1);
}
console.log("Smoke Neon OK.");
