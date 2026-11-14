import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTagById } from "@/lib/server/repository";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ tagId: z.string().uuid("Identifiant invalide.") });

/** Fiche d'un tag par identifiant. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ tagId: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const tag = await getTagById(parsed.data.tagId);
  if (!tag) return notFound("Tag introuvable.");
  return NextResponse.json({ tag });
}
