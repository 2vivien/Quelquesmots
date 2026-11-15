import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getInteractionState, listFeed, InvalidFeedCursorError } from "@/lib/server/repository";
import { badRequest, rateLimit, clientIp } from "@/lib/server/http";

const querySchema = z.object({
  themeId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  sort: z.enum(["recent", "top"]).default("recent"),
  cursor: z.string().trim().max(128).nullish(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Retourne une page de textes filtrée et paginée par curseur. */
export async function GET(req: NextRequest) {
  const limited = await rateLimit(`feed:${clientIp(req)}`, 120, 60_000);
  if (limited) return limited;

  const parsed = querySchema.safeParse({
    themeId: req.nextUrl.searchParams.get("themeId") ?? undefined,
    tagId: req.nextUrl.searchParams.get("tagId") ?? undefined,
    authorId: req.nextUrl.searchParams.get("authorId") ?? undefined,
    sort: req.nextUrl.searchParams.get("sort") ?? "recent",
    cursor: req.nextUrl.searchParams.get("cursor"),
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return badRequest("Paramètres invalides.");

  const viewer = await getSessionUser(req);
  const blockedAuthorIds = viewer ? (await getInteractionState(viewer.id)).blockedUserIds : [];
  try {
    const page = await listFeed({
      themeId: parsed.data.themeId,
      tagId: parsed.data.tagId,
      authorId: parsed.data.authorId,
      sort: parsed.data.sort,
      cursor: parsed.data.cursor ?? null,
      limit: parsed.data.limit,
      viewerId: viewer?.id ?? null,
      blockedAuthorIds,
    });
    return NextResponse.json(page, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch (err) {
    if (err instanceof InvalidFeedCursorError) return badRequest("Curseur invalide.");
    throw err;
  }
}
