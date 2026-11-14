import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { getPostById, getSettings, publishPost } from "@/lib/server/store";
import { badRequest, notFound, rateLimit, jsonError } from "@/lib/server/http";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Publie un brouillon après validation serveur (limites du site + quotidien). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`publish:${auth.user.id}`, 10, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const draft = await getPostById(parsed.data.id);
  if (!draft || draft.authorId !== auth.user.id) return notFound("Brouillon introuvable.");
  if (draft.status !== "DRAFT" && draft.status !== "UNDER_REVIEW") {
    return badRequest("Ce texte est déjà publié.");
  }
  const settings = await getSettings();
  const title = draft.title.trim();
  if (title.length < 3 || title.length > 120) {
    return badRequest("Le titre doit contenir entre 3 et 120 caractères.");
  }
  const bodyLength = draft.contentText.trim().length;
  if (bodyLength < settings.minChars) {
    return badRequest(`Votre texte doit contenir au moins ${settings.minChars} caractères.`);
  }
  if (bodyLength > settings.maxChars) {
    return badRequest(`Votre texte dépasse la limite de ${settings.maxChars} caractères.`);
  }
  if (draft.themeSlugs.length < 1) {
    return badRequest("Choisissez au moins 1 thème.");
  }
  if (draft.themeSlugs.length > settings.maxTags) {
    return badRequest(`Maximum ${settings.maxTags} thèmes.`);
  }
  const published = await publishPost(draft.id, auth.user.id, settings.dailyPublishLimit);
  if (published === "not-found") return notFound("Brouillon introuvable.");
  if (published === "limit") {
    return jsonError(429, "RATE_LIMITED", "Limite quotidienne de publications atteinte. Revenez demain.");
  }
  return NextResponse.json({ post: published });
}
