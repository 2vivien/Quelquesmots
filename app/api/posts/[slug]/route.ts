import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, getPostBySlug } from "@/lib/server/store";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Fiche d'un texte par slug public ou identifiant interne, avec contrôle de visibilité. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");

  const viewer = getSessionUser(req);
  const key = parsed.data.slug;
  const bySlug = getPostBySlug(key, viewer?.id ?? null);
  const byId = bySlug ? null : getPostById(key);
  const post = bySlug ?? (byId && canViewPost(byId, viewer?.id ?? null) ? byId : null);

  if (!post) return notFound("Texte introuvable.");
  return NextResponse.json({ post });
}
