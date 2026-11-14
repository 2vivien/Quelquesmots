import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { hideComment } from "@/lib/server/repository";
import { badRequest, forbidden, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Masque un commentaire (auteur du commentaire, auteur du texte, ou modération). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`hide-comment:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const result = await hideComment(parsed.data.id, auth.user);
  if (result === "not-found") return notFound("Commentaire introuvable.");
  if (result === "forbidden") return forbidden("Vous ne pouvez pas masquer ce commentaire.");
  return NextResponse.json({ ok: true });
}
