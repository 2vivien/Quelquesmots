import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getInteractionState, listFeed, InvalidFeedCursorError } from "@/lib/server/repository";
import { badRequest, rateLimit, clientIp } from "@/lib/server/http";

const querySchema = z.object({
  theme: z.string().trim().max(64).optional(),
  tag: z.string().trim().max(64).optional(),
  author: z.string().trim().max(64).optional(),
  sort: z.enum(["recent", "top"]).default("recent"),
  cursor: z.string().trim().max(128).nullish(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Retourne une page de textes filtrée et paginée par curseur. */
export async function GET(req: NextRequest) {
  const limited = await rateLimit(`feed:${clientIp(req)}`, 120, 60_000);
  if (limited) return limited;

  const parsed = querySchema.safeParse({
    theme: req.nextUrl.searchParams.get("theme") ?? undefined,
    tag: req.nextUrl.searchParams.get("tag") ?? undefined,
    author: req.nextUrl.searchParams.get("author") ?? undefined,
    sort: req.nextUrl.searchParams.get("sort") ?? "recent",
    cursor: req.nextUrl.searchParams.get("cursor"),
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) return badRequest("Paramètres invalides.");

  const viewer = await getSessionUser(req);
  const blockedAuthorIds = viewer ? (await getInteractionState(viewer.id)).blockedUserIds : [];
  try {
    const page = await listFeed({
      themeSlug: parsed.data.theme,
      tagSlug: parsed.data.tag,
      authorUsername: parsed.data.author,
      sort: parsed.data.sort,
      cursor: parsed.data.cursor ?? null,
      limit: parsed.data.limit,
      viewerId: viewer?.id ?? null,
      blockedAuthorIds,
    });
    return NextResponse.json(page);
  } catch (err) {
    if (err instanceof InvalidFeedCursorError) return badRequest("Curseur invalide.");
    throw err;
  }
}
