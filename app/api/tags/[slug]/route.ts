import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTagBySlug } from "@/lib/server/store";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(64) });

/** Fiche d'un tag par slug. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Slug invalide.");
  const tag = await getTagBySlug(parsed.data.slug);
  if (!tag) return notFound("Tag introuvable.");
  return NextResponse.json({ tag });
}
