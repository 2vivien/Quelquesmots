import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, getPostBySlug, listRelated } from "@/lib/server/store";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Textes liés (mêmes thèmes), 3 maximum. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const viewer = getSessionUser(req);
  const key = parsed.data.slug;
  const post = getPostBySlug(key, viewer?.id ?? null) ?? getPostById(key);
  if (!post) return notFound("Texte introuvable.");
  return NextResponse.json({ items: listRelated(post, viewer?.id ?? null) });
}
