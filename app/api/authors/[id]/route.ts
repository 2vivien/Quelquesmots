import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthorById } from "@/lib/server/repository";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().uuid("Identifiant invalide.") });

/** Fiche publique d'un auteur par identifiant. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const author = await getAuthorById(parsed.data.id);
  if (!author) return notFound("Auteur introuvable.");
  return NextResponse.json({ author }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } });
}
