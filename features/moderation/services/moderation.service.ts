import { env } from "@/lib/env";
import type { ModerationService } from "../types/moderation.types";
import { moderationMock } from "./moderation.mock";
import { moderationReal } from "./moderation.real";

/** Sélectionne le service de modération selon `NEXT_PUBLIC_USE_MOCK`. */
export const moderationService: ModerationService = env.USE_MOCK
  ? moderationMock
  : moderationReal;
