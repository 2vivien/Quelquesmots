import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, getPostBySlug, listRelated } from "@/lib/server/store";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Textes liés (mêmes thèmes), 3 maximum ; la visibilité du texte source est vérifiée. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");

  const viewer = await getSessionUser(req);
  const key = parsed.data.slug;
  const bySlug = await getPostBySlug(key, viewer?.id ?? null);
  const byId = bySlug ? null : await getPostById(key);
  const post = bySlug ?? (byId && canViewPost(byId, viewer?.id ?? null) ? byId : null);

  if (!post) return notFound("Texte introuvable.");
  return NextResponse.json({ items: await listRelated(post, viewer?.id ?? null) });
}
