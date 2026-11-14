import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { markNotificationsRead } from "@/lib/server/repository";
import { parseJsonBody, rateLimit } from "@/lib/server/http";
import { notificationsReadSchema } from "@/lib/server/schemas";

/** Marque comme lues les notifications appartenant à l'utilisateur connecté. */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`notif-read:${auth.user.id}`, 60, 60_000);
  if (limited) return limited;
  const body = await parseJsonBody(req, notificationsReadSchema);
  if (!body.ok) return body.response;
  await markNotificationsRead(auth.user.id, body.data.ids);
  return NextResponse.json({ ok: true });
}
