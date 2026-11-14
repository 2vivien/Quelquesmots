"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth";
import { useComments } from "../hooks/useComments";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { openAuthPopup } from "@/lib/open-auth";

/** Section commentaires sous un texte lu. */
export function CommentList({ postId, postAuthorId, commentsEnabled }: { postId: string; postAuthorId: string; commentsEnabled: boolean }) {
  const { user } = useAuth();
  const { comments, addMutation, hideMutation, likeMutation } = useComments(postId);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#commentaires") {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (!commentsEnabled) return null;

  const roots = comments.filter((c) => !c.parentId);
  return (
    <section id="commentaires" className="space-y-5 border-t border-bord pt-8">
      <h2 className="font-serif text-2xl text-encre">Commentaires ({comments.length})</h2>
      <div ref={formRef}>
        {user ? (
          <CommentForm
            replyToId={replyTo}
            onCancelReply={() => setReplyTo(null)}
            disabled={addMutation.isPending}
            onSubmit={(body) => {
              addMutation.mutate({ body, parentId: replyTo });
              setReplyTo(null);
            }}
          />
        ) : (
          <p className="text-sm text-muted"><button type="button" onClick={openAuthPopup} className="underline underline-offset-2 hover:text-encre">Connectez-vous</button> pour laisser un commentaire.</p>
        )}
      </div>
      <div>
        {roots.map((root) => (
          <div key={root.id}>
            <CommentItem
              comment={root}
              canHide={user?.id === postAuthorId || user?.id === root.authorId}
              onReply={user ? () => setReplyTo(root.id) : openAuthPopup}
              onLike={(id) => likeMutation.mutate(id)}
              onHide={(id) => hideMutation.mutate(id)}
            />
            {comments
              .filter((r) => r.parentId === root.id)
              .map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  canHide={user?.id === postAuthorId || user?.id === reply.authorId}
                  onReply={user ? () => setReplyTo(root.id) : openAuthPopup}
                  onLike={(id) => likeMutation.mutate(id)}
                  onHide={(id) => hideMutation.mutate(id)}
                />
              ))}
          </div>
        ))}
      </div>
      {comments.length === 0 ? <p className="py-6 text-center font-serif italic text-muted">Soyez le premier à commenter.</p> : null}
    </section>
  );
}
