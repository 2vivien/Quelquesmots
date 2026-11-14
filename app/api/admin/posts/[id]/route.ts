import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { getPostById, pushAudit, setModerationStatus } from "@/lib/server/store";
import { badRequest, notFound, parseJsonBody, rateLimit } from "@/lib/server/http";
import { adminPostPatchSchema } from "@/lib/server/schemas";

const paramsSchema = z.object({ id: z.string().trim().min(1).max(64) });

/** Change le statut/verrouillage éditorial d'un texte (modération). */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`admin-post:${auth.user.id}`, 30, 60_000);
  if (limited) return limited;
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Identifiant invalide.");
  const post = await getPostById(parsed.data.id);
  if (!post) return notFound("Texte introuvable.");
  const body = await parseJsonBody(req, adminPostPatchSchema);
  if (!body.ok) return body.response;
  await setModerationStatus(post.id, body.data.status, body.data.locked);
  await pushAudit(
    auth.user.username,
    body.data.status === "HIDDEN" ? "HIDE" : "RESTORE",
    post.title,
    `Statut → ${body.data.status}${body.data.locked ? " (verrouillé)" : ""}`,
  );
  return NextResponse.json({ ok: true });
}
