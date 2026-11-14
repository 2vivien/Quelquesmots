/**
 * Stockage local des photos de profil uploadées.
 * Écrit dans `.uploads/` (gitignored, configurable via UPLOAD_DIR) et servi via /api/uploads/[file].
 * Noms de fichiers générés par l' serveur (UUID) : aucune confiance dans le nom client.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
const MAX_BYTES = 5 * 1024 * 1024;

const SIGNATURES: Array<{ ext: string; type: string; matches: (b: Buffer) => boolean }> = [
  { ext: "jpg", type: "image/jpeg", matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    type: "image/png",
    matches: (b) =>
      b.length > 8 &&
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "webp",
    type: "image/webp",
    matches: (b) =>
      b.length > 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
];

const FILE_NAME = /^avatar-[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** Détecte la signature d'un fichier image ; renvoie son extension et type MIME. */
export function matchImageBuffer(buffer: Buffer): { ext: string; type: string } | null {
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return null;
  const signature = SIGNATURES.find((s) => s.matches(buffer));
  return signature ? { ext: signature.ext, type: signature.type } : null;
}

/** Nom de fichier sûr pour un upload (UUID). */
export function newAvatarFilename(ext: string): string {
  return `avatar-${randomUUID()}.${ext}`;
}

/** Valide et enregistre une photo de profil ; renvoie son URL publique, ou `null` si le contenu n'est pas une image acceptée. */
export async function saveAvatar(buffer: Buffer): Promise<{ url: string; file: string } | null> {
  const match = matchImageBuffer(buffer);
  if (!match) return null;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const file = newAvatarFilename(match.ext);
  await writeFile(path.join(UPLOAD_DIR, file), buffer);
  return { url: `/api/uploads/${file}`, file };
}

/** Relit un fichier uploadé avec un nom strictement validé (anti-traversée). */
export async function readUpload(file: string): Promise<{ buffer: Buffer; type: string } | null> {
  if (!FILE_NAME.test(file)) return null;
  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, file));
    const ext = file.split(".").pop();
    const type = ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
    return { buffer, type };
  } catch {
    return null;
  }
}
