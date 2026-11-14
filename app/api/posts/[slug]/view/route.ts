import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostById, getPostBySlug, recordView, viewerKeyFromIp } from "@/lib/server/store";
import { badRequest, clientIp, notFound, rateLimit } from "@/lib/server/http";

const paramsSchema = z.object({ slug: z.string().trim().min(1).max(120) });

/** Comptabilise une vue de lecture (façon YouTube : chaque visite compte ; dédoublonnage 90 s ; robots ignorés). */
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
  const viewer = getSessionUser(req);
  const post = getPostById(parsed.data.slug) ?? getPostBySlug(parsed.data.slug, viewer?.id ?? null);
  if (!post) return notFound("Texte introuvable.");
  const viewerKey = viewer ? `u:${viewer.id}` : `ip:${viewerKeyFromIp(clientIp(req))}`;
  const limited = rateLimit(`view:${viewerKey}`, 60, 60_000);
  if (limited) return NextResponse.json({ counted: false });
  const counted = recordView(post.id, viewerKey);
  return NextResponse.json({ counted });
}
