import { env } from "@/lib/env";
import type { AuthService } from "../types/auth.types";
import { authMock } from "./auth.mock";
import { authReal } from "./auth.real";

/** Sélectionne le service d'authentification selon `NEXT_PUBLIC_USE_MOCK`. */
export const authService: AuthService = env.USE_MOCK ? authMock : authReal;
