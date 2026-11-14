/**
 * Client S3 compatible (MinIO, AWS, Cloudflare R2…) pour stocker les photos de profil.
 * Configuration par variables d'environnement :
 *   S3_ENDPOINT   (ex. http://localhost:9000)
 *   S3_REGION     (défaut us-east-1)
 *   S3_BUCKET     (défaut « assets »)
 *   S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
 *   S3_PREFIX     (défaut « uploads »)
 * Si S3 n'est pas configuré, l'upload bascule sur le stockage fichier local (`.uploads/`).
 */
import "dotenv/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET ?? "assets";
const region = process.env.S3_REGION ?? "us-east-1";
const prefix = (process.env.S3_PREFIX ?? "uploads").replace(/\/+$/, "");

const client = endpoint
  ? new S3Client({
      forcePathStyle: true,
      endpoint,
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    })
  : null;

/** Indique si S3 est configuré et utilisable. */
export function s3Configured(): boolean {
  return client !== null;
}

/** Clé S3 complète (préfixe/chemin). */
export function s3Key(file: string): string {
  return `${prefix}/${file}`;
}

/** Enregistre un fichier dans S3. */
export async function s3PutObject(file: string, body: Buffer, contentType: string): Promise<void> {
  if (!client) throw new Error("S3 non configuré.");
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: s3Key(file), Body: body, ContentType: contentType }));
}

/** Récupère un fichier depuis S3 sous forme de tampon. */
export async function s3GetObject(file: string): Promise<Buffer | null> {
  if (!client) return null;
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key(file) }));
    const body = result.Body;
    if (!body) return null;
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  } catch {
    return null;
  }
}

/** URL signée 1 heure pour visualisation (cas bucket privé). */
export async function s3SignedUrl(file: string): Promise<string | null> {
  if (!client) return null;
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: s3Key(file) }), { expiresIn: 3600 });
}
