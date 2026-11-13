import type { SearchService } from "../types/search.types";
import { searchReal } from "./search.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const searchService: SearchService = searchReal;
