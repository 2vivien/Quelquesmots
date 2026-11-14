import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { saveAvatar, matchImageBuffer, newAvatarFilename } from "@/lib/server/uploads";
import { s3Configured, s3PutObject } from "@/lib/server/s3";
import { badRequest, rateLimit } from "@/lib/server/http";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload d'une photo de profil (JPEG/PNG/WebP, 5 Mo max) — stockée sur S3 si configuré, sinon sur disque. */
export async function POST(req: NextRequest) {
  const auth = requireUser(req);
  if (!auth.ok) return auth.response;
  const limited = rateLimit(`upload-avatar:${auth.user.id}`, 20, 600_000);
  if (limited) return limited;
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Requête invalide : multipart/form-data attendu.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("Aucun fichier reçu.");
  if (file.size === 0) return badRequest("Fichier vide.");
  if (file.size > MAX_BYTES) return badRequest("Image trop lourde : 5 Mo maximum.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const match = matchImageBuffer(buffer);
  if (!match) return badRequest("Format non supporté : JPEG, PNG ou WebP uniquement.");

  if (s3Configured()) {
    const key = newAvatarFilename(match.ext);
    try {
      await s3PutObject(key, buffer, match.type);
      return NextResponse.json({ url: `/api/uploads/${key}` }, { status: 201 });
    } catch (err) {
      console.error("[uploads] S3 échec, repli disque :", err instanceof Error ? err.message : String(err));
      // Repli disque si S3 échoue (endpoint indisponible, credentials rejetés…)
    }
  }
  const saved = await saveAvatar(buffer);
  return NextResponse.json({ url: saved!.url }, { status: 201 });
}
