import { env } from "@/lib/env";
import type { AuthorsService } from "../types/authors.types";
import { authorsMock } from "./authors.mock";
import { authorsReal } from "./authors.real";

/** Sélectionne le service auteurs selon `NEXT_PUBLIC_USE_MOCK`. */
export const authorsService: AuthorsService = env.USE_MOCK
  ? authorsMock
  : authorsReal;
