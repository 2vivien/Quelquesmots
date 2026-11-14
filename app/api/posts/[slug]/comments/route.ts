import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireUser } from "@/lib/server/auth";
import { addComment, getPostById, getPostBySlug, listComments } from "@/lib/server/store";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound, parseJsonBody, rateLimit } from "@/lib/server/http";
import { commentCreateSchema } from "@/lib/server/schemas";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Liste les commentaires visibles d'un texte. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const viewer = getSessionUser(req);
  const key = parsed.data.slug;
  const byId = getPostById(key);
  const post = byId
    ? canViewPost(byId, viewer?.id ?? null) ? byId : null
    : getPostBySlug(key, viewer?.id ?? null);
  if (!post) return notFound("Texte introuvable.");
  return NextResponse.json({ comments: listComments(post.id, viewer?.id ?? null) });
}

/** Ajoute un commentaire (auteur dérivé de la session, limité à 10 par 10 minutes). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`comment:${auth.user.id}`, 10, 600_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const body = await parseJsonBody(req, commentCreateSchema);
  if (!body.ok) return body.response;
  const key = parsed.data.slug;
  const byId = getPostById(key);
  const post = byId
    ? canViewPost(byId, auth.user.id) ? byId : null
    : getPostBySlug(key, auth.user.id);
  if (!post) return notFound("Texte introuvable.");
  const created = addComment({ postId: post.id, author: auth.user, parentId: body.data.parentId ?? null, body: body.data.body });
  if (!created) return badRequest("Les commentaires sont désactivés pour ce texte.");
  return NextResponse.json({ comment: created }, { status: 201 });
}
