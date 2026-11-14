import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { isUsernameAvailable, updateUserProfile } from "@/lib/server/store";
import { jsonError, parseJsonBody, rateLimit } from "@/lib/server/http";
import { profilePatchSchema } from "@/lib/server/schemas";

/** Met à jour le profil de l'utilisateur connecté (pseudonyme unique). */
export async function PATCH(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`profile:${auth.user.id}`, 10, 60_000);
  if (limited) return limited;
  const body = await parseJsonBody(req, profilePatchSchema);
  if (!body.ok) return body.response;
  const { onboarded, ...profilePatch } = body.data;
  if (
    profilePatch.username !== undefined &&
    !isUsernameAvailable(profilePatch.username, auth.user.id)
  ) {
    return jsonError(400, "VALIDATION", "Ce pseudonyme est déjà utilisé.", { username: "Ce pseudonyme est déjà utilisé." });
  }
  const updated = await updateUserProfile(auth.user.id, {
    ...profilePatch,
    ...(onboarded !== undefined ? { onboarded } : {}),
  });
  if (!updated) return jsonError(404, "NOT_FOUND", "Utilisateur introuvable.");
  return NextResponse.json({ user: updated });
}
