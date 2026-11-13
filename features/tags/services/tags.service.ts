import type { TagsService } from "../types/tags.types";
import { tagsReal } from "./tags.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const tagsService: TagsService = tagsReal;
