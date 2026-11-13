import type { ModerationService } from "../types/moderation.types";
import { moderationReal } from "./moderation.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const moderationService: ModerationService = moderationReal;
