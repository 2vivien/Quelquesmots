import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthorByUsername } from "@/lib/server/store";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ username: z.string().trim().min(1).max(64) });

/** Fiche publique d'un auteur par pseudonyme. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ username: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Pseudonyme invalide.");
  const author = getAuthorByUsername(decodeURIComponent(parsed.data.username));
  if (!author) return notFound("Auteur introuvable.");
  return NextResponse.json({ author });
}
