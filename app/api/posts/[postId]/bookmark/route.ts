import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { getPostById, toggleBookmark } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ postId: z.string().uuid("Identifiant invalide.") });

/** Bascule la sauvegarde du texte dans la bibliothèque de l'utilisateur. */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`bookmark:${auth.user.id}`, 60, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const byId = await getPostById(parsed.data.postId);
  const post = byId ? (canViewPost(byId, auth.user.id) ? byId : null) : null;
  if (!post) return notFound("Texte introuvable.");
  const result = await toggleBookmark(auth.user.id, post.id);
  if (!result) return notFound("Texte introuvable.");
  return NextResponse.json(result);
}
