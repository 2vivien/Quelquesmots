import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { listNotifications } from "@/lib/server/repository";
import { PRIVATE_NO_STORE } from "@/lib/server/http";

/** Notifications de l'utilisateur connecté (100 plus récentes). */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ items: await listNotifications(auth.user.id) }, { headers: PRIVATE_NO_STORE });
}
