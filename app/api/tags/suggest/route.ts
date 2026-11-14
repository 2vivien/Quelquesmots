import { NextRequest, NextResponse } from "next/server";
import { suggestTagsFromText } from "@/lib/server/repository";
import { parseJsonBody, rateLimit } from "@/lib/server/http";
import { tagsSuggestSchema } from "@/lib/server/schemas";

/** Propose jusqu'à 5 tags pour un texte saisi dans le Studio. */
export async function POST(req: NextRequest) {
  const limited = await rateLimit(`tags-suggest:${req.headers.get("x-forwarded-for") ?? "local"}`, 30, 60_000);
  if (limited) return limited;
  const body = await parseJsonBody(req, tagsSuggestSchema);
  if (!body.ok) return body.response;
  return NextResponse.json({ suggestions: await suggestTagsFromText(body.data.text) });
}
