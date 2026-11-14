import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getThemeBySlug } from "@/lib/server/store";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/i, "Slug invalide.") });

/** Fiche d'un thème par slug. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Slug invalide.");
  const theme = getThemeBySlug(parsed.data.slug);
  if (!theme) return notFound("Thème introuvable.");
  return NextResponse.json({ theme });
}
