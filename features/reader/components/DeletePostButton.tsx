"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { postsService } from "@/features/posts";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DeletePostButtonProps {
  postId: string;
  postAuthorId: string;
  postTitle: string;
}

/**
 * Bouton « Supprimer » visible uniquement au propriétaire du texte ou à un administrateur.
 * La suppression est « douce » (status DELETED) via l'API studio.
 */
export function DeletePostButton({ postId, postAuthorId, postTitle }: DeletePostButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canDelete = Boolean(user && (user.id === postAuthorId || user.role === "admin"));

  const confirm = async () => {
    setLoading(true);
    try {
      const ok = await postsService.deletePost(postId, user?.id ?? "");
      if (!ok) throw new Error("Suppression impossible.");
      toast.success("Texte supprimé");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  if (!canDelete) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Supprimer ce texte"
        title="Supprimer ce texte"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-bord bg-carte text-muted transition-colors hover:border-encre hover:bg-pilule hover:text-encre"
      >
        <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <ConfirmDialog
        open={open}
        title="Supprimer ce texte ?"
        message={`« ${postTitle.trim() || "Sans titre"} » sera masqué définitivement. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        destructive
        loading={loading}
        onConfirm={() => void confirm()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
