import { NextResponse } from "next/server";
import { listTags } from "@/lib/server/store";

/** Tags approuvés les plus utilisés. */
export async function GET() {
  return NextResponse.json({ tags: await listTags() });
}
