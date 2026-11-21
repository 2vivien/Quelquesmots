import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, recordView } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ postId: z.string().uuid("Identifiant invalide.") });

const VISITOR_COOKIE = "qm_vid";
const VISITOR_MAX_AGE = 365 * 24 * 60 * 60; // 1 an

/** Construit la réponse JSON en posant un identifiant de visiteur stable (anonyme) si absent. */
function jsonWithVisitor(body: { counted: boolean }, visitorId: string | null): NextResponse {
  const res = NextResponse.json(body);
  if (visitorId) {
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_MAX_AGE,
    });
  }
  return res;
}

/**
 * Comptabilise une consultation valide après lecture.
 * Dédoublonnage 90 s **par texte et par visiteur** :
 * - connecté → identifiant utilisateur (stable) ;
 * - anonyme → cookie `qm_vid` (stable par navigateur, pas d'IP partagée).
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");

  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|slurp|preview/i.test(ua)) {
    return jsonWithVisitor({ counted: false }, null);
  }

  const viewer = await getSessionUser(req);
  const key = parsed.data.postId;
  const byId = await getPostById(key);
  const post = byId ? (canViewPost(byId, viewer?.id ?? null) ? byId : null) : null;
  if (!post) return notFound("Texte introuvable.");

  let newVisitorId: string | null = null;
  const existingVisitor = req.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitor ?? (newVisitorId = randomUUID());
  const viewerKey = viewer ? `u:${viewer.id}` : `v:${visitorId}`;

  const limited = await rateLimit(`view:${viewerKey}`, 60, 60_000);
  if (limited) return jsonWithVisitor({ counted: false }, newVisitorId);

  const counted = await recordView(post.id, viewerKey);
  return jsonWithVisitor({ counted }, newVisitorId);
}
