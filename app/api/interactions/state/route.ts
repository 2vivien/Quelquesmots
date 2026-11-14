import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getInteractionState } from "@/lib/server/store";

/** État des interactions de l'utilisateur connecté (vide pour un invité). */
export async function GET(req: NextRequest) {
  const viewer = await getSessionUser(req);
  if (!viewer) {
    return NextResponse.json({ likedIds: [], dislikedIds: [], bookmarkedIds: [], blockedUserIds: [], followedUserIds: [] });
  }
  return NextResponse.json(await getInteractionState(viewer.id));
}
