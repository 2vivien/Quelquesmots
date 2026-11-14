import { NextRequest, NextResponse } from "next/server";
import { listAuthors } from "@/lib/server/repository";

/** Annuaire public des plumes, filtrable par `?q=`. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  if (q && q.length > 120) return NextResponse.json({ authors: [] });
  return NextResponse.json({ authors: await listAuthors(q) });
}
