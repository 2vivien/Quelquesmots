import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { deletePost } from "@/lib/server/store";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Supprime (logiquement) un texte : auteur du texte, ou administrateur. */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`delete-post:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const isMod = auth.user.role === "admin";
  const ok = deletePost(parsed.data.id, auth.user.id, isMod);
  if (!ok) return notFound("Texte introuvable.");
  return NextResponse.json({ ok: true });
}
