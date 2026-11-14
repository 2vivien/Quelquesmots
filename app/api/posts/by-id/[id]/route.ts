import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPostById } from "@/lib/server/store";
import { badRequest, notFound } from "@/lib/server/http";
import { canViewPost } from "@/features/posts/utils/visibility";
import { getSessionUser } from "@/lib/server/auth";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Fiche d'un texte par identifiant interne. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const viewer = await getSessionUser(req);
  const post = await getPostById(parsed.data.id);
  if (!post || !canViewPost(post, viewer?.id ?? null)) return notFound("Texte introuvable.");
  return NextResponse.json({ post });
}
