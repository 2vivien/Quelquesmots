import { env } from "@/lib/env";
import type { CommentsService } from "../types/comments.types";
import { commentsMock } from "./comments.mock";
import { commentsReal } from "./comments.real";

/** Sélectionne le service de commentaires selon `NEXT_PUBLIC_USE_MOCK`. */
export const commentsService: CommentsService = env.USE_MOCK
  ? commentsMock
  : commentsReal;
