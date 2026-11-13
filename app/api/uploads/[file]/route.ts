import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readUpload } from "@/lib/server/uploads";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ file: z.string().trim().min(1).max(80) });

/** Sert une photo uploadée (cache immuable : les noms sont des UUID). */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ file: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Nom de fichier invalide.");
  const found = await readUpload(parsed.data.file);
  if (!found) return notFound("Photo introuvable.");
  return new NextResponse(new Uint8Array(found.buffer), {
    status: 200,
    headers: {
      "Content-Type": found.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
