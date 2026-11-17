import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { createReport } from "@/lib/server/repository";
import { badRequest, jsonError, parseJsonBody, rateLimit } from "@/lib/server/http";
import { reportCreateSchema } from "@/lib/server/schemas";

/** Dépose un signalement (20 par jour, dédupliqué par cible). */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = await rateLimit(`report:${auth.user.id}`, 20, 86_400_000, true);
  if (limited) return limited;
  const body = await parseJsonBody(req, reportCreateSchema);
  if (!body.ok) return body.response;
  const created = await createReport({ reporterId: auth.user.id, ...body.data });
  if (created === "duplicate") {
    return jsonError(400, "VALIDATION", "Vous avez déjà signalé ce contenu.");
  }
  return NextResponse.json({ report: created }, { status: 201 });
}
