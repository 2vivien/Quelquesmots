"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthorAvatar } from "@/features/authors";
import type { ProfileFormValues } from "../schemas/profile.schema";
import { downscaleAvatar } from "../utils/avatar-image";
import { PublishAsRadio } from "./PublishAsRadio";

interface ProfileFormProps {
  avatarUrl: string;
  initial: ProfileFormValues;
  onSave: (values: ProfileFormValues) => Promise<boolean>;
  onAvatarChange: (avatarUrl: string) => Promise<void>;
}

/**
 * Formulaire complet des informations personnelles et préférences de publication (écran 11).
 * @param props Avatar, valeurs initiales, action de sauvegarde et choix de photo.
 */
export function ProfileForm({ avatarUrl, initial, onSave, onAvatarChange }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormValues>(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = (e: React.FormEvent) => { e.preventDefault(); void onSave(form); };

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
      await onAvatarChange(data.url);
    } catch {
      toast.error("L'envoi de la photo a échoué.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-[16px] border border-bord bg-carte p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <AuthorAvatar src={avatarUrl} alt={form.username} size={72} ring />
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
          className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-bord px-4 py-2 text-xs text-encre hover:bg-pilule disabled:opacity-60"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Camera size={14} aria-hidden="true" />}
          {uploading ? "Envoi…" : "Changer la photo"}
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-encre"><span>Prénom</span><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-[12px] border border-bord bg-pilule px-3.5 py-2 text-sm focus:border-encre focus:outline-none" /></label>
        <label className="space-y-1 text-sm text-encre"><span>Nom</span><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-[12px] border border-bord bg-pilule px-3.5 py-2 text-sm focus:border-encre focus:outline-none" /></label>
      </div>
      <label className="block space-y-1 text-sm text-encre"><span>Pseudonyme</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full rounded-[12px] border border-bord bg-pilule px-3.5 py-2 text-sm focus:border-encre focus:outline-none" /></label>
      <label className="block space-y-1 text-sm text-encre"><span>Biographie</span><textarea rows={2} maxLength={160} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full rounded-[12px] border border-bord bg-pilule px-3.5 py-2 text-sm focus:border-encre focus:outline-none" /></label>
      <PublishAsRadio value={form.defaultPublishAs} onChange={(v) => setForm({ ...form, defaultPublishAs: v })} />
      <div className="space-y-2 text-sm text-encre">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.listedInDirectory} onChange={(e) => setForm({ ...form, listedInDirectory: e.target.checked })} className="accent-encre-fort" /><span>Apparaître dans l&apos;annuaire des auteurs</span></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.showJoinDate} onChange={(e) => setForm({ ...form, showJoinDate: e.target.checked })} className="accent-encre-fort" /><span>Afficher ma date d&apos;inscription</span></label>
      </div>
      <button type="submit" className="min-h-[44px] rounded-full bg-encre-fort px-6 py-2 text-sm font-medium text-ivoire hover:opacity-90">Enregistrer</button>
    </form>
  );
}
