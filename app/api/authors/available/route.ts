import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isUsernameAvailable } from "@/lib/server/repository";
import { badRequest, rateLimit, clientIp } from "@/lib/server/http";

const querySchema = z.object({
  username: z.string().trim().min(1).max(24).regex(/^[a-zA-Z0-9._-]+$/, "Format de pseudonyme invalide."),
});

/** Disponibilité d'un pseudonyme (onboarding). */
export async function GET(req: NextRequest) {
  const limited = rateLimit(`username-check:${clientIp(req)}`, 60, 60_000);
  if (limited) return limited;
  const parsed = querySchema.safeParse({
    username: req.nextUrl.searchParams.get("username") ?? "",
  });
  if (!parsed.success) return badRequest("Pseudonyme invalide.");
  return NextResponse.json({ available: await isUsernameAvailable(parsed.data.username) });
}
