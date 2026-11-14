import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readUpload } from "@/lib/server/uploads";
import { s3Configured, s3GetObject } from "@/lib/server/s3";
import { badRequest, jsonError, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ file: z.string().trim().min(1).max(80) });

/** Sert une photo depuis le stockage objet en production ou le disque local en développement. */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ file: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Nom de fichier invalide.");
  const file = parsed.data.file;

  if (s3Configured()) {
    const buffer = await s3GetObject(file);
    if (!buffer) return notFound("Photo introuvable.");
    const ext = file.split(".").pop();
    const type = ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (process.env.NODE_ENV === "production") {
    return jsonError(503, "INTERNAL", "Le stockage des images n'est pas configuré.");
  }

  const local = await readUpload(file);
  if (!local) return notFound("Photo introuvable.");
  return new NextResponse(new Uint8Array(local.buffer), {
    headers: {
      "Content-Type": local.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
