import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { getPostById, getPostBySlug, toggleBookmark } from "@/lib/server/store";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Bascule la sauvegarde du texte dans la bibliothèque de l'utilisateur. */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`bookmark:${auth.user.id}`, 60, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const byId = getPostById(parsed.data.slug);
  const post = byId
    ? canViewPost(byId, auth.user.id) ? byId : null
    : getPostBySlug(parsed.data.slug, auth.user.id);
  if (!post) return notFound("Texte introuvable.");
  const result = toggleBookmark(auth.user.id, post.id);
  if (!result) return notFound("Texte introuvable.");
  return NextResponse.json(result);
}
