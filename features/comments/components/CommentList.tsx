"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth";
import { useComments } from "../hooks/useComments";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

/** Section commentaires sous un texte lu. */
export function CommentList({ postId, postAuthorId, commentsEnabled }: { postId: string; postAuthorId: string; commentsEnabled: boolean }) {
  const { user } = useAuth();
  const { comments, addMutation, hideMutation } = useComments(postId);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  if (!commentsEnabled) return null;

  const roots = comments.filter((c) => !c.parentId);
  return (
    <section className="space-y-5 border-t border-bord pt-8">
      <h2 className="font-serif text-2xl text-encre">Commentaires ({comments.length})</h2>
      {user ? (
        <CommentForm replyToId={replyTo} onCancelReply={() => setReplyTo(null)} disabled={addMutation.isPending} onSubmit={(body) => { addMutation.mutate({ body, parentId: replyTo }); setReplyTo(null); }} />
      ) : (
        <p className="text-sm text-muted"><Link href="/connexion" className="underline hover:text-encre">Connectez-vous</Link> pour laisser un commentaire.</p>
      )}
      <div>
        {roots.map((root) => (
          <div key={root.id}>
            <CommentItem comment={root} canHide={user?.id === postAuthorId} onReply={setReplyTo} onHide={(id) => hideMutation.mutate(id)} />
            {comments.filter((r) => r.parentId === root.id).map((reply) => (
              <CommentItem key={reply.id} comment={reply} canHide={user?.id === postAuthorId} onHide={(id) => hideMutation.mutate(id)} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
