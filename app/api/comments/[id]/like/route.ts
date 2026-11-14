import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { toggleCommentLike } from "@/lib/server/repository";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Bascule le « j'aime » sur un commentaire (auteur ou lecteur). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`comment-like:${auth.user.id}`, 60, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const result = await toggleCommentLike(parsed.data.id, auth.user.id);
  if (!result) return notFound("Commentaire introuvable.");
  return NextResponse.json(result);
}
