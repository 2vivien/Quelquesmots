import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { listNotifications } from "@/lib/server/store";

/** Notifications de l'utilisateur connecté (100 plus récentes). */
export async function GET(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ items: listNotifications(auth.user.id) });
}
