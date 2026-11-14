/**
 * Client S3 compatible (Neon Object Storage, MinIO, AWS, Cloudflare R2…) pour les photos de profil.
 * Configuration par variables d'environnement (format AWS standard) :
 *   AWS_ENDPOINT_URL_S3        (ex. https://<project>.storage.aws.neon.tech)
 *   AWS_REGION                 (ex. us-east-2 ; défaut us-east-2)
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   S3_BUCKET                  (défaut « assets »)
 *   S3_PREFIX                  (défaut « uploads »)
 * Repli rétrocompatible : S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.
 * Si rien n'est configuré, l'upload bascule sur le stockage fichier local (`.uploads/`).
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET ?? "assets";
const region = process.env.AWS_REGION ?? process.env.S3_REGION ?? "us-east-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY ?? "";
const prefix = (process.env.S3_PREFIX ?? "uploads").replace(/\/+$/, "");

const client = endpoint
  ? new S3Client({
      forcePathStyle: true,
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
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
