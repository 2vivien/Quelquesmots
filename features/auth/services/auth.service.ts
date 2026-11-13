import type { AuthService } from "../types/auth.types";
import { authReal } from "./auth.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const authService: AuthService = authReal;
