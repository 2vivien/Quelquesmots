import type { CommentsService } from "../types/comments.types";
import { commentsReal } from "./comments.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const commentsService: CommentsService = commentsReal;
