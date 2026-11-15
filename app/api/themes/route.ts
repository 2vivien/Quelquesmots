import { NextRequest, NextResponse } from "next/server";
import { listThemes } from "@/lib/server/repository";

/** Thèmes actifs, triés par position, filtrables par `?q=`. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  if (q && q.length > 120) return NextResponse.json({ themes: [] });
  return NextResponse.json({ themes: await listThemes(q) }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } });
}
