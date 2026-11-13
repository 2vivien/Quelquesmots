import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { getPostById, getPostBySlug, toggleDislike } from "@/lib/server/store";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Bascule le « j'aime pas » du texte (exclusif avec « j'aime »). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`dislike:${auth.user.id}`, 60, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const post = getPostById(parsed.data.slug) ?? getPostBySlug(parsed.data.slug, auth.user.id);
  if (!post) return notFound("Texte introuvable.");
  const result = toggleDislike(auth.user.id, post.id);
  if (!result) return notFound("Texte introuvable.");
  return NextResponse.json(result);
}
