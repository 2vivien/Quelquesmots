import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, listRelated } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ postId: z.string().uuid("Identifiant invalide.") });

/** Textes liés (mêmes thèmes), 3 maximum ; la visibilité du texte source est vérifiée. */
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
  return NextResponse.json({ items: await listRelated(post, viewer?.id ?? null) });
}
