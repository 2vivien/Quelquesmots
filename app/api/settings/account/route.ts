import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { clearSessionCookie } from "@/lib/server/session";
import { deleteAccount } from "@/lib/server/store";
import { rateLimit } from "@/lib/server/http";

/** Suppression définitive du compte courant : contenu supprimé, session invalidée. */
export async function DELETE(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`delete-account:${auth.user.id}`, 3, 3_600_000);
  if (limited) return limited;
  await deleteAccount(auth.user.id);
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
