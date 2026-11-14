import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { pushAudit, setReportStatus } from "@/lib/server/repository";
import { badRequest, notFound, parseJsonBody, rateLimit } from "@/lib/server/http";
import { reportStatusSchema } from "@/lib/server/schemas";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Clôture un signalement (RESOLVED ou DISMISSED). */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`admin-report:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const body = await parseJsonBody(req, reportStatusSchema);
  if (!body.ok) return body.response;
  const ok = await setReportStatus(parsed.data.id, body.data.status);
  if (!ok) return notFound("Signalement introuvable.");
  await pushAudit(auth.user.username, body.data.status, `Signalement ${parsed.data.id}`, "Clôture manuelle du signalement");
  return NextResponse.json({ ok: true });
}
