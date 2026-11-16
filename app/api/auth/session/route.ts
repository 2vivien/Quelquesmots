import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { rateLimit, clientIp, PRIVATE_NO_STORE } from "@/lib/server/http";

/** Session courante (toujours 200 ; `user` vaut `null` pour un invité). */
export async function GET(req: NextRequest) {
  const limited = await rateLimit(`session:${clientIp(req)}`, 120, 60_000);
  if (limited) return limited;
  return NextResponse.json({ user: await getSessionUser(req) }, { headers: PRIVATE_NO_STORE });
}
