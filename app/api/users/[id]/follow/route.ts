import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { findUserById, getDb, toggleFollow } from "@/lib/server/store";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Suit/ne suit plus un auteur (met à jour son compteur d'abonnés). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`follow:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const targetId = parsed.data.id;
  if (targetId === auth.user.id) return badRequest("Vous ne pouvez pas vous suivre vous-même.");
  const exists = findUserById(targetId) ?? getDb().authors.some((a) => a.userId === targetId);
  if (!exists) return notFound("Utilisateur introuvable.");
  return NextResponse.json(toggleFollow(auth.user.id, targetId));
}
