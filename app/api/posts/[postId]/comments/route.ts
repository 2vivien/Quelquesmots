import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireUser } from "@/lib/server/auth";
import { addComment, getPostById, listComments } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound, parseJsonBody, rateLimit, PRIVATE_NO_STORE } from "@/lib/server/http";
import { commentCreateSchema } from "@/lib/server/schemas";

const paramsSchema = z.object({ postId: z.string().uuid("Identifiant invalide.") });

/** Liste les commentaires visibles d'un texte. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const viewer = await getSessionUser(req);
  const key = parsed.data.postId;
  const byId = await getPostById(key);
  const post = byId ? (canViewPost(byId, viewer?.id ?? null) ? byId : null) : null;
  if (!post) return notFound("Texte introuvable.");
  return NextResponse.json({ comments: await listComments(post.id, viewer?.id ?? null) }, { headers: PRIVATE_NO_STORE });
}

/** Ajoute un commentaire (auteur dérivé de la session, limité à 10 par 10 minutes). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`comment:${auth.user.id}`, 10, 600_000, true);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const body = await parseJsonBody(req, commentCreateSchema);
  if (!body.ok) return body.response;
  const key = parsed.data.postId;
  const byId = await getPostById(key);
  const post = byId ? (canViewPost(byId, auth.user.id) ? byId : null) : null;
  if (!post) return notFound("Texte introuvable.");
  const created = await addComment({ postId: post.id, author: auth.user, parentId: body.data.parentId ?? null, body: body.data.body });
  if (created.kind === "disabled") return badRequest("Les commentaires sont désactivés pour ce texte.");
  if (created.kind === "invalid-parent") return badRequest("La réponse cible un commentaire introuvable ou masqué.");
  return NextResponse.json({ comment: created.comment }, { status: 201 });
}
