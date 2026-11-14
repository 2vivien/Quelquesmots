import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ postId: z.string().uuid("Identifiant invalide.") });

/** Fiche d'un texte par identifiant, avec contrôle de visibilité. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");

  const viewer = await getSessionUser(req);
  const byId = await getPostById(parsed.data.postId);
  const post = byId ? (canViewPost(byId, viewer?.id ?? null) ? byId : null) : null;

  if (!post) return notFound("Texte introuvable.");
  return NextResponse.json({ post });
}
