import type { InteractionsService } from "../types/interactions.types";
import { interactionsReal } from "./interactions.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const interactionsService: InteractionsService = interactionsReal;
