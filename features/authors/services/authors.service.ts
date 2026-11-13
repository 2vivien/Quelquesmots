import type { AuthorsService } from "../types/authors.types";
import { authorsReal } from "./authors.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const authorsService: AuthorsService = authorsReal;
