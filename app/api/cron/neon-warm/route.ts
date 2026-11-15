import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDatabase } from "@/db";
import { rateLimit } from "@/lib/server/http";

/** Réveille l'endpoint Neon (SELECT 1) pour éviter le scale-to-zéro. Réservé au cron (CRON_SECRET). */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
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
