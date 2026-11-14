import { NextResponse } from "next/server";
import { listTags } from "@/lib/server/repository";

/** Tags approuvés les plus utilisés. */
export async function GET() {
  return NextResponse.json({ tags: await listTags() });
}
