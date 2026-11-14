import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { search } from "@/lib/server/repository";
import { badRequest, clientIp, rateLimit } from "@/lib/server/http";

/** Jusqu'à 5 suggestions mixtes dès 2 caractères. */
export async function GET(req: NextRequest) {
  const limited = rateLimit(`suggest:${clientIp(req)}`, 120, 60_000);
  if (limited) return limited;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ items: [] });
  if (q.length > 120) return badRequest("Recherche trop longue.");
  const viewer = await getSessionUser(req);
  const result = await search(q, "all", viewer?.id ?? null);
  return NextResponse.json({ items: result.items.slice(0, 5) });
}
