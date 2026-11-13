import { NextRequest, NextResponse } from "next/server";
import { listThemes } from "@/lib/server/store";

/** Thèmes actifs, triés par position, filtrables par `?q=`. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  if (q && q.length > 120) return NextResponse.json({ themes: [] });
  return NextResponse.json({ themes: listThemes(q) });
}
