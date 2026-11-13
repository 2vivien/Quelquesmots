import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { listReports } from "@/lib/server/store";

/** File de signalements (triée par priorité). */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ reports: listReports() });
}
