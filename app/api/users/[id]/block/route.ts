import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { findUserById, toggleBlockUser } from "@/lib/server/repository";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Bloque/débloque un auteur (masque ses textes dans votre mur). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`block:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const targetId = parsed.data.id;
  if (targetId === auth.user.id) return badRequest("Vous ne pouvez pas vous bloquer vous-même.");
  const exists = await findUserById(targetId);
  if (!exists) return notFound("Utilisateur introuvable.");
  return NextResponse.json(await toggleBlockUser(auth.user.id, targetId));
}
