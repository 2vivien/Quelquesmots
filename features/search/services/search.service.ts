import { env } from "@/lib/env";
import type { SearchService } from "../types/search.types";
import { searchMock } from "./search.mock";
import { searchReal } from "./search.real";

/** Sélectionne le service de recherche selon `NEXT_PUBLIC_USE_MOCK`. */
export const searchService: SearchService = env.USE_MOCK
  ? searchMock
  : searchReal;
