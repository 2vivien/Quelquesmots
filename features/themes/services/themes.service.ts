import { env } from "@/lib/env";
import type { ThemesService } from "../types/themes.types";
import { themesMock } from "./themes.mock";
import { themesReal } from "./themes.real";

/** Sélectionne le service thèmes selon `NEXT_PUBLIC_USE_MOCK`. */
export const themesService: ThemesService = env.USE_MOCK
  ? themesMock
  : themesReal;
