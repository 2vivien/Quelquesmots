"use client";

import { useState } from "react";
import { AuthorAvatar } from "@/features/authors";
import type { ProfileFormValues } from "../schemas/profile.schema";
import { PublishAsRadio } from "./PublishAsRadio";

interface ProfileFormProps {
  avatarUrl: string;
  initial: ProfileFormValues;
  onSave: (values: ProfileFormValues) => Promise<boolean>;
}

/**
 * Formulaire complet des informations personnelles et préférences de publication (écran 11).
 * @param props Avatar, valeurs initiales et action de sauvegarde.
 */
export function ProfileForm({ avatarUrl, initial, onSave }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormValues>(initial);
  const submit = (e: React.FormEvent) => { e.preventDefault(); void onSave(form); };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-[16px] border border-bord bg-carte p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <AuthorAvatar src={avatarUrl} alt={form.username} size={72} ring />
        <span className="rounded-full border border-bord px-4 py-2 text-xs text-encre">Changer la photo</span>
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
