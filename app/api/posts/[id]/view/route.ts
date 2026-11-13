import { NextRequest, NextResponse } from "next/server";
import { interactionsService } from "@/features/interactions";

/** Comptabilise une vue unique par jour pour un texte donné. */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider/i.test(ua)) {
    return NextResponse.json({ counted: false });
  }
  const counted = await interactionsService.recordView(id, "api-viewer");
  return NextResponse.json({ counted });
}
