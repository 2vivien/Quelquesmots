import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthorById, getAuthorByUsername } from "@/lib/server/repository";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().uuid("Identifiant invalide.") });

/** Fiche publique d'un auteur par id (ou pseudonyme en rétrocompatibilité). */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const key = parsed.data.id;
  const author = await getAuthorById(key) ?? await getAuthorByUsername(key);
  if (!author) return notFound("Auteur introuvable.");
  return NextResponse.json({ author });
}
