import { env } from "@/lib/env";
import type { TagsService } from "../types/tags.types";
import { tagsMock } from "./tags.mock";
import { tagsReal } from "./tags.real";

/** Sélectionne le service tags selon `NEXT_PUBLIC_USE_MOCK`. */
export const tagsService: TagsService = env.USE_MOCK ? tagsMock : tagsReal;
