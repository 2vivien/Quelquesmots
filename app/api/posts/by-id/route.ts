import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getPostsByIds } from "@/lib/server/repository";
import { badRequest, clientIp, rateLimit } from "@/lib/server/http";

const querySchema = z.object({
  ids: z.array(z.string().trim().min(1).max(64)).min(1).max(100),
});

/** Charge jusqu'à 100 textes visibles en une requête, notamment pour la bibliothèque. */
export async function GET(req: NextRequest) {
  const limited = rateLimit(`posts-by-id:${clientIp(req)}`, 60, 60_000);
  if (limited) return limited;

  const parsed = querySchema.safeParse({
    ids: req.nextUrl.searchParams.getAll("id"),
  });
  if (!parsed.success) return badRequest("Liste de textes invalide.");

  const viewer = await getSessionUser(req);
  const ids = Array.from(new Set(parsed.data.ids));
  const posts = await getPostsByIds(ids, viewer?.id ?? null);
  return NextResponse.json({ posts });
}
