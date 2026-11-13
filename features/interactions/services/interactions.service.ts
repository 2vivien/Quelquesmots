import { env } from "@/lib/env";
import type { InteractionsService } from "../types/interactions.types";
import { interactionsMock } from "./interactions.mock";
import { interactionsReal } from "./interactions.real";

/** Sélectionne le service d'interactions selon `NEXT_PUBLIC_USE_MOCK`. */
export const interactionsService: InteractionsService = env.USE_MOCK
  ? interactionsMock
  : interactionsReal;
