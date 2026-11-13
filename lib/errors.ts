/** Codes d'erreur applicatifs standardisés. */
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VALIDATION"
  | "LOCKED";

/** Résultat typé retourné par les actions et services. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      fieldErrors?: Record<string, string>;
    };

/** Erreur applicative typée avec code métier. */
export class AppError extends Error {
  public readonly code: ErrorCode;

  /**
   * Construit une erreur applicative.
   * @param code Code métier de l'erreur.
   * @param message Message lisible en français.
   */
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
}
