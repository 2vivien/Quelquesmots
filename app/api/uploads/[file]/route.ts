import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readUpload } from "@/lib/server/uploads";
import { s3Configured, s3GetObject } from "@/lib/server/s3";
import { badRequest, notFound } from "@/lib/server/http";

const paramsSchema = z.object({ file: z.string().trim().min(1).max(80) });

/** Sert une photo uploadée (S3 si configuré, sinon disque local ; cache immuable : UUID dans le nom). */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ file: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) return badRequest("Nom de fichier invalide.");
  const file = parsed.data.file;
  const ext = file.split(".").pop();
  const type = ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "application/octet-stream";

  if (s3Configured()) {
    const buffer = await s3GetObject(file);
    if (buffer) {
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    // Repli disque si S3 ne renvoie rien
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
