import { NextRequest, NextResponse } from "next/server";
import { searchService } from "@/features/search";

/** Retourne jusqu'à 5 suggestions mixtes (minimum 2 caractères). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ items: [] });
  }
  const items = await searchService.suggest(q, null);
  return NextResponse.json({ items });
}
