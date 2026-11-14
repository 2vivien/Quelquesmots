import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import {
  listDrafts,
  upsertDraft,
  findUserById,
  countDraftsByAuthor,
} from "@/lib/server/repository";
import { badRequest, notFound, parseJsonBody, rateLimit } from "@/lib/server/http";
import { draftUpsertSchema } from "@/lib/server/schemas";
import { extractPlainText, sanitizeTiptapDoc } from "@/lib/sanitize";
import type { TiptapDoc } from "@/types";

/** Brouillons de l'auteur connecté. */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ drafts: await listDrafts(auth.user.id) });
}

/** Crée ou met à jour un brouillon (auteur dérivé de la session, contenu assaini). */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`draft:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const body = await parseJsonBody(req, draftUpsertSchema);
  if (!body.ok) return body.response;
  const draftCount = await countDraftsByAuthor(auth.user.id);
  if (!body.data.id && draftCount >= 50) {
    return badRequest("Limite de 50 brouillons atteinte. Supprimez-en un avant de continuer.");
  }
  const author = await findUserById(auth.user.id) ?? auth.user;
  const cleanJson =
    body.data.contentJson && typeof body.data.contentJson === "object"
      ? sanitizeTiptapDoc(body.data.contentJson as TiptapDoc)
      : undefined;
  const contentText =
    body.data.contentText ?? (cleanJson ? extractPlainText(cleanJson) : undefined);
  const saved = await upsertDraft({
    id: body.data.id,
    authorId: auth.user.id,
    authorUsername: author.username,
    authorFirstName: author.firstName,
    authorLastName: author.lastName,
    authorAvatarUrl: author.avatarUrl,
    publishAs: body.data.publishAs,
    title: body.data.title,
    excerpt: body.data.excerpt ?? (contentText ? contentText.slice(0, 140) : undefined),
    contentJson: cleanJson,
    contentText,
    visibility: body.data.visibility,
    themeSlugs: body.data.themeSlugs,
    tagSlugs: body.data.tagSlugs,
    heroImageUrl: body.data.heroImageUrl,
    commentsEnabled: body.data.commentsEnabled,
  });
  if (!saved) return notFound("Brouillon introuvable ou déjà publié.");
  return NextResponse.json({ draft: saved });
}
