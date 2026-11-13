import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getSettings, pushAudit, updateSettings } from "@/lib/server/store";
import { badRequest, parseJsonBody, rateLimit } from "@/lib/server/http";
import { siteSettingsSchema } from "@/lib/server/schemas";

/** Paramètres globaux du site (lecture administrateur). */
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json(getSettings());
}

/** Met à jour les paramètres globaux (zod + audit). */
export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`admin-settings:${auth.user.id}`, 10, 60_000);
  if (limited) return limited;
  const body = await parseJsonBody(req, siteSettingsSchema);
  if (!body.ok) return body.response;
  if (body.data.minChars > body.data.maxChars) {
    return badRequest("La longueur minimale ne peut pas dépasser la longueur maximale.");
  }
  const saved = updateSettings(body.data);
  pushAudit(auth.user.username, "SETTINGS", "Paramètres du site", "Mise à jour des réglages globaux");
  return NextResponse.json(saved);
}
