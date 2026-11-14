import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { adminModerate } from "@/lib/server/repository";
import { parseJsonBody, rateLimit } from "@/lib/server/http";
import { moderateSchema } from "@/lib/server/schemas";

/** Applique une décision de modération (masquage, restauration, classement) + audit. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`moderate:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const body = await parseJsonBody(req, moderateSchema);
  if (!body.ok) return body.response;
  await adminModerate({ actorUsername: auth.user.username, ...body.data });
  return NextResponse.json({ ok: true });
}
