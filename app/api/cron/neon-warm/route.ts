import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDatabase } from "@/db";
import { rateLimit } from "@/lib/server/http";

/** Comparaison constante du Bearer token (échec 401 sans révéler le secret, pas de fuite par timing). */
function bearerMatches(header: string, expected: string): boolean {
  const match = header.match(/^Bearer\s+(.+)$/i);
  const candidate = match?.[1];
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Réveille l'endpoint Neon (SELECT 1) pour éviter le scale-to-zéro. Réservé au cron (CRON_SECRET). */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!expected || !bearerMatches(header, expected)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  // Limite : 1 appel / minute par IP (évite une boucle accidentelle côté client).
  const limited = await rateLimit(`cron-warm:${req.headers.get("x-forwarded-for") ?? "local"}`, 1, 60_000);
  if (limited) return limited;
  try {
    const db = getDatabase();
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("neon-warm: SELECT 1 a échoué", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
