import { NextResponse } from "next/server";
import { listTags } from "@/lib/server/repository";

/** Tags approuvés les plus utilisés. */
export async function GET() {
  return NextResponse.json({ tags: await listTags() }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } });
}
