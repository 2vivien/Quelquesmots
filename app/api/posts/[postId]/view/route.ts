import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, recordView, viewerKeyFromIp } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, clientIp, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ postId: z.string().uuid("Identifiant invalide.") });

/** Comptabilise une consultation valide ; dédoublonnage de 90 s et robots ignorés. */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");

  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|slurp|preview/i.test(ua)) {
    return NextResponse.json({ counted: false });
  }

  const viewer = await getSessionUser(req);
  const key = parsed.data.postId;
  const byId = await getPostById(key);
  const post = byId ? (canViewPost(byId, viewer?.id ?? null) ? byId : null) : null;
  if (!post) return notFound("Texte introuvable.");

  const viewerKey = viewer ? `u:${viewer.id}` : `ip:${viewerKeyFromIp(clientIp(req))}`;
  const limited = await rateLimit(`view:${viewerKey}`, 60, 60_000);
  if (limited) return NextResponse.json({ counted: false });

  const counted = await recordView(post.id, viewerKey);
  return NextResponse.json({ counted });
}
