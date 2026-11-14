import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { deletePost } from "@/lib/server/repository";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().uuid("Identifiant invalide.") });

/** Supprime (logiquement) un texte : auteur du texte, ou administrateur. */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`delete-post:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const isMod = auth.user.role === "admin";
  const ok = await deletePost(parsed.data.id, auth.user.id, isMod);
  if (!ok) return notFound("Texte introuvable.");
  return NextResponse.json({ ok: true });
}
