import type { PostsService } from "../types/posts.types";
import { postsReal } from "./posts.real";

/** Le service délègue aux routes `/api/*` (backend réel). */
export const postsService: PostsService = postsReal;
