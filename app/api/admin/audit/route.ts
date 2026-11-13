import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { listAudit } from "@/lib/server/store";

/** Journal d'audit administratif (200 dernières entrées). */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ entries: listAudit() });
}
