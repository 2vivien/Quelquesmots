import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_USE_MOCK: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_API_BACKEND_READY: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,
  NEXT_PUBLIC_API_BACKEND_READY: process.env.NEXT_PUBLIC_API_BACKEND_READY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

const values = parsed.success ? parsed.data : {};

/** Configuration d'environnement validée au démarrage.
 * Le mode démonstration (mock) est la valeur par défaut ;
 * définissez `NEXT_PUBLIC_USE_MOCK=false` pour activer les routes API réelles. */
export const env = {
  USE_MOCK: values.NEXT_PUBLIC_USE_MOCK !== "false",
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
