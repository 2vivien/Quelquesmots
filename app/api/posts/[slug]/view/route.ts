import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, getPostBySlug, recordView, viewerKeyFromIp } from "@/lib/server/repository";
import { canViewPost } from "@/features/posts/utils/visibility";
import { badRequest, clientIp, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Comptabilise une consultation valide ; dédoublonnage de 90 s et robots ignorés. */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");

  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|slurp|preview/i.test(ua)) {
    return NextResponse.json({ counted: false });
  }

  const viewer = await getSessionUser(req);
  const key = parsed.data.slug;
  const bySlug = await getPostBySlug(key, viewer?.id ?? null);
  const byId = bySlug ? null : await getPostById(key);
  const post = bySlug ?? (byId && canViewPost(byId, viewer?.id ?? null) ? byId : null);
  if (!post) return notFound("Texte introuvable.");

  const viewerKey = viewer ? `u:${viewer.id}` : `ip:${viewerKeyFromIp(clientIp(req))}`;
  const limited = await rateLimit(`view:${viewerKey}`, 60, 60_000);
  if (limited) return NextResponse.json({ counted: false });

  const counted = await recordView(post.id, viewerKey);
  return NextResponse.json({ counted });
}
