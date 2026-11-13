import { env } from "@/lib/env";
import type { PostsService } from "../types/posts.types";
import { postsMock } from "./posts.mock";
import { postsReal } from "./posts.real";

/** Sélectionne le service des textes selon `NEXT_PUBLIC_USE_MOCK`. */
export const postsService: PostsService = env.USE_MOCK ? postsMock : postsReal;
