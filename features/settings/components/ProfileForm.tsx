"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { ProfileFormValues } from "../schemas/profile.schema";
import { PublishAsRadio } from "./PublishAsRadio";
import { ProfileFormHeader } from "./ProfileFormHeader";
import { ToggleTile } from "./ToggleTile";

interface ProfileFormProps {
  avatarUrl: string;
  initial: ProfileFormValues;
  onSave: (values: ProfileFormValues) => Promise<boolean>;
  onAvatarChange: (avatarUrl: string) => Promise<void>;
}

const labelCls = "text-[11px] font-black uppercase tracking-[0.2em] text-mute";
const fieldCls = "w-full rounded-[16px] border-[2px] border-encre bg-[#FFF8ED] px-4 py-2.5 text-[14px] font-medium text-encre outline-none transition placeholder:text-muted focus:border-encre-fort focus:ring-4 focus:ring-jaune/60";

/** Formulaire complet du profil, look Trugly (cartes bordées fines, ombres dures). */
export function ProfileForm({ avatarUrl, initial, onSave, onAvatarChange }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormValues>(initial);
  const submit = (e: React.FormEvent) => { e.preventDefault(); void onSave(form); };

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-[28px] border-[3px] border-encre bg-[#FAF2EA] shadow-[10px_10px_0_0_var(--color-ink-jar)]">
      <ProfileFormHeader avatarUrl={avatarUrl} username={form.username} onAvatarUploaded={onAvatarChange} />

      <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={labelCls}>Prénom</span>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={fieldCls} placeholder="Prénom" autoComplete="given-name" />
          </label>
          <label className="block space-y-1">
            <span className={labelCls}>Nom</span>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={fieldCls} placeholder="Nom" autoComplete="family-name" />
          </label>
        </div>

        <label className="block space-y-1">
          <span className={labelCls}>Pseudonyme</span>
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={fieldCls} placeholder="votre-pseudonyme" autoComplete="username" />
        </label>

        <label className="block space-y-1">
          <span className={labelCls}>Biographie <span className="text-[10px] text-muted">({form.bio.length}/160)</span></span>
          <textarea rows={2} maxLength={160} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={fieldCls} placeholder="Quelques mots sur toi…" />
        </label>

        <PublishAsRadio value={form.defaultPublishAs} onChange={(v) => setForm({ ...form, defaultPublishAs: v })} />

        <fieldset className="space-y-2">
          <legend className={labelCls}>Confidentialité &amp; annuaire</legend>
          <ToggleTile checked={form.listedInDirectory} onChange={(v) => setForm({ ...form, listedInDirectory: v })} label="Apparaître dans l'annuaire des auteurs" active="#FFB4CF" />
          <ToggleTile checked={form.showJoinDate} onChange={(v) => setForm({ ...form, showJoinDate: v })} label="Afficher ma date d'inscription" active="#BDE0FE" />
        </fieldset>
      </div>

      <div className="border-t-[3px] border-encre bg-carte px-6 py-5 sm:px-8">
        <button type="submit" className="btn-jaune min-h-[48px] w-full text-base sm:w-auto">
          <Save size={18} strokeWidth={2.5} aria-hidden="true" />
          Enregistrer
        </button>
      </div>
    </form>
  );
}
