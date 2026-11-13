import type { ThemesService } from "../types/themes.types";
import { themesReal } from "./themes.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const themesService: ThemesService = themesReal;
