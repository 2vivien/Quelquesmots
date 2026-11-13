import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

const values = parsed.success ? parsed.data : {};

/** Configuration d'environnement validée au démarrage. */
export const env = {
  APP_URL: values.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000",
} as const;

/**
 * Résout un chemin d'API relatif côté navigateur et en URL absolue côté serveur Node.js.
 * @param path Chemin relatif commençant par `/api/...`.
 */
export function apiUrl(path: string): string {
  if (typeof window !== "undefined") return path;
  const base = env.APP_URL || "http://127.0.0.1:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
