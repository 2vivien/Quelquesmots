import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getThemeById } from "@/lib/server/repository";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().uuid("Identifiant invalide.") });

/** Fiche d'un thème par identifiant. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const theme = await getThemeById(parsed.data.id);
  if (!theme) return notFound("Thème introuvable.");
  return NextResponse.json({ theme }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } });
}
