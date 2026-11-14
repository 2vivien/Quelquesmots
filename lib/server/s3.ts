/**
 * Client S3 compatible pour les avatars.
 * En production, un stockage objet configuré est obligatoire : le disque local
 * n'est conservé que pour le développement local.
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET ?? "assets";
const region = process.env.AWS_REGION ?? process.env.S3_REGION ?? "us-east-2";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY ?? "";
const prefix = (process.env.S3_PREFIX ?? "uploads").replace(/\/+$/, "");
const storageReady = Boolean(endpoint && accessKeyId && secretAccessKey);

const client = storageReady
  ? new S3Client({
      forcePathStyle: true,
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

/** Indique si le stockage objet dispose de son endpoint et de ses identifiants. */
export function s3Configured(): boolean {
  return client !== null;
}

/** Clé S3 complète (préfixe/chemin). */
export function s3Key(file: string): string {
  return `${prefix}/${file}`;
}

/** Enregistre un fichier dans S3. */
export async function s3PutObject(file: string, body: Buffer, contentType: string): Promise<void> {
  if (!client) throw new Error("Stockage objet non configuré.");
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: s3Key(file), Body: body, ContentType: contentType }));
}

/** Récupère un fichier depuis S3 sous forme de tampon. */
export async function s3GetObject(file: string): Promise<Buffer | null> {
  if (!client) return null;
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key(file) }));
    const body = result.Body;
    if (!body) return null;
    return Buffer.from(await body.transformToByteArray());
  } catch {
    return null;
  }
}

/** URL signée 1 heure pour visualisation (cas bucket privé). */
export async function s3SignedUrl(file: string): Promise<string | null> {
  if (!client) return null;
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: s3Key(file) }), { expiresIn: 3600 });
}
