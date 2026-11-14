import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const values = envSchema.parse({
  APP_URL: process.env.APP_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

/** Configuration d'environnement validée au démarrage. */
export const env = {
  APP_URL: values.APP_URL ?? values.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000",
} as const;

/**
 * Résout un chemin d'API relatif côté navigateur et en URL absolue côté serveur Node.js.
 * @param path Chemin relatif commençant par `/api/...`.
 */
export function apiUrl(path: string): string {
  if (typeof window !== "undefined") return path;
  const base = env.APP_URL;
  return `${base.replace(/\/$/, "")}${path}`;
}
