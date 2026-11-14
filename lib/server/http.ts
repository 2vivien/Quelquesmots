import "./zod-fr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ratelimit";
import type { ErrorCode } from "@/lib/errors";

/** Réponse d'erreur uniforme `{ error: { code, message } }`. */
export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}

export const badRequest = (message: string, fieldErrors?: Record<string, string>) =>
  jsonError(400, "VALIDATION", message, fieldErrors);
export const unauthorized = (message = "Connexion requise.") =>
  jsonError(401, "UNAUTHENTICATED", message);
export const forbidden = (message = "Action non autorisée.") =>
  jsonError(403, "FORBIDDEN", message);
export const notFound = (message = "Ressource introuvable.") =>
  jsonError(404, "NOT_FOUND", message);

/** Applique la limitation de débit ; renvoie une 429 si dépassée, sinon `null`. */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  return (await checkRateLimit(key, limit, windowMs))
    ? null
    : jsonError(429, "RATE_LIMITED", "Trop de requêtes. Réessayez dans un instant.");
}

/** Adresse IP cliente (proxy) ou `unknown` en local. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/** Parse et valide le corps JSON d'une requête avec un schéma Zod. */
export async function parseJsonBody<S extends z.ZodTypeAny>(
  req: NextRequest,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: badRequest("Corps JSON invalide.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      ok: false,
      response: badRequest(parsed.error.issues[0]?.message ?? "Données invalides.", fieldErrors),
    };
  }
  return { ok: true, data: parsed.data };
}
