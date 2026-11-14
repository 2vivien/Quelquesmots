import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server/session";

/** Déconnexion : révoque la session PostgreSQL et supprime le cookie. */
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  await clearSessionCookie(res, req);
  return res;
}
