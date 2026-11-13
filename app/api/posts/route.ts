import { NextRequest, NextResponse } from "next/server";
import { postsService } from "@/features/posts";

/** Retourne une page de textes paginée par curseur pour le Mur et les filtres. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sortParam = sp.get("sort") === "top" ? "top" : "recent";
  const page = await postsService.listFeed({
    themeSlug: sp.get("theme") ?? undefined,
    tagSlug: sp.get("tag") ?? undefined,
    authorUsername: sp.get("author") ?? undefined,
    sort: sortParam,
    cursor: sp.get("cursor"),
    limit: 20,
    viewerId: null,
  });
  return NextResponse.json(page);
}
