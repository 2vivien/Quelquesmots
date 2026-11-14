import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { getPostById, toggleLike } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ postId: z.string().uuid("Identifiant invalide.") });

/** Bascule le « j'aime » du texte (exclusif avec « j'aime pas »). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`like:${auth.user.id}`, 60, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const byId = await getPostById(parsed.data.postId);
  const post = byId ? (canViewPost(byId, auth.user.id) ? byId : null) : null;
  if (!post) return notFound("Texte introuvable.");
  const result = await toggleLike(auth.user.id, post.id);
  if (!result) return notFound("Texte introuvable.");
  return NextResponse.json(result);
}
