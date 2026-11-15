"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthorAvatar } from "@/features/authors";
import { downscaleAvatar } from "../utils/avatar-image";

interface ProfileFormHeaderProps {
  avatarUrl: string;
  username: string;
  /** Appelé après un upload réussi (renvoie la nouvelle URL). */
  onAvatarUploaded: (url: string) => Promise<void>;
}

/** Bandeau « Mon profil » (avatar + changement photo), look Trugly. */
export function ProfileFormHeader({ avatarUrl, username, onAvatarUploaded }: ProfileFormHeaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const blob = await downscaleAvatar(file);
      if (!blob) {
        toast.error("Cette image ne peut pas être lue. Essayez un JPEG ou un PNG.");
        return;
      }
      const payload = new FormData();
      payload.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/uploads/avatar", { method: "POST", body: payload });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: { message?: string } } | null;
      if (!res.ok || !data?.url) {
        toast.error(data?.error?.message ?? "L'envoi de la photo a échoué.");
        return;
      }
      await onAvatarUploaded(data.url);
    } catch {
      toast.error("L'envoi de la photo a échoué.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4 border-b-[3px] border-encre bg-jaune px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div className="flex items-center gap-4">
        <div className="rounded-full border-[3px] border-encre bg-carte p-1 shadow-[4px_4px_0_0_var(--color-ink-jar)]">
          <AuthorAvatar src={avatarUrl} alt={username} size={72} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-display text-[15px] uppercase leading-none tracking-wide text-encre">Mon profil</span>
          <span className="font-serif text-sm italic text-encre/80">@{username}</span>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => void handleFile(e)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex min-h-[42px] items-center gap-2 rounded-full border-[2px] border-encre bg-carte px-4 text-xs font-bold text-encre shadow-[3px_3px_0_0_var(--color-ink-jar)] transition hover:-translate-y-0.5 hover:bg-jaune-fonce disabled:opacity-60"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Camera size={14} aria-hidden="true" />}
        {uploading ? "Envoi…" : "Changer la photo"}
      </button>
    </div>
  );
}
