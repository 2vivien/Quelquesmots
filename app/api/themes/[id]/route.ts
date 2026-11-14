import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getThemeById, getThemeBySlug } from "@/lib/server/store";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Fiche d'un thème par id (ou slug en rétrocompatibilité). */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const key = parsed.data.id;
  const theme = await getThemeById(key) ?? await getThemeBySlug(key);
  if (!theme) return notFound("Thème introuvable.");
  return NextResponse.json({ theme });
}
