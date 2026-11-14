import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { search } from "@/lib/server/repository";
import { badRequest, clientIp, rateLimit } from "@/lib/server/http";

const querySchema = z.object({
  q: z.string().trim().min(1, "Recherche vide.").max(120),
  tab: z.enum(["all", "posts", "themes", "authors", "tags"]).default("all"),
});

/** Recherche globale multi-entités (textes, thèmes, auteurs, tags). */
export async function GET(req: NextRequest) {
  const limited = rateLimit(`search:${clientIp(req)}`, 60, 60_000);
  if (limited) return limited;
  const parsed = querySchema.safeParse({
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    tab: req.nextUrl.searchParams.get("tab") ?? "all",
  });
  if (!parsed.success) return badRequest("Paramètres de recherche invalides.");
  const viewer = await getSessionUser(req);
  return NextResponse.json(search(parsed.data.q, parsed.data.tab, viewer?.id ?? null));
}
