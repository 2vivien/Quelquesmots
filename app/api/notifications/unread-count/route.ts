import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { countUnreadNotifications } from "@/lib/server/repository";
import { PRIVATE_NO_STORE } from "@/lib/server/http";

/** Compteur de notifications non lues de l'utilisateur connecté (requête COUNT légère). */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ count: await countUnreadNotifications(auth.user.id) }, { headers: PRIVATE_NO_STORE });
}
