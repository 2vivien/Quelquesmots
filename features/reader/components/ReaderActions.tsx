"use client";

import { ReportDialog } from "@/features/moderation";
import type { PostRecord } from "@/features/posts";
import { DeletePostButton } from "./DeletePostButton";

/** Actions sur un texte lu : suppression pour propriétaire/admin, signalement pour tous. */
export function ReaderActions({ post }: { post: PostRecord }) {
  return (
    <div className="flex items-center gap-1.5">
      <DeletePostButton postId={post.id} postAuthorId={post.authorId} postTitle={post.title} />
      <ReportDialog targetType="POST" targetId={post.id} targetLabel={post.title} />
    </div>
  );
}
