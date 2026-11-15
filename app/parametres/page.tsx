"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { openAuthPopup } from "@/lib/open-auth";
import { DangerZone, ProfileForm, useSettings } from "@/features/settings";

/** Page des paramètres de profil et confidentialité (écran 11) — look Trugly. */
export default function SettingsPage() {
  const { user, saveProfile, changeAvatar, signOutAndRedirect, requestDeletion } = useSettings();

  if (!user) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/editorial/trugy_popup_sans_fond_final.png"
          alt="Tronc de Quelques mots — mascotte du site"
          className="w-44 object-contain drop-shadow-[4px_4px_0_var(--color-ink-jar)]"
          width={180}
          height={160}
        />
        <h1 className="font-display text-[40px] uppercase leading-[0.86] tracking-tight text-encre drop-shadow-[2px_2px_0_var(--color-jaune)]">
          Connexion<br />requise
        </h1>
        <p className="font-serif text-lg italic text-encre/85">
          Gère ton profil, tes publications et tes préférences.
        </p>
        <button type="button" onClick={openAuthPopup} className="btn-jaune min-h-[48px] w-full text-base">
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[840px] space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Retour au mur" className="flex h-11 w-11 items-center justify-center rounded-full border-[2px] border-encre bg-carte text-encre shadow-[2px_2px_0_0_var(--color-ink-jar)] transition hover:-translate-y-0.5 hover:bg-pilule">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>
        <div className="flex flex-col">
          <span className="font-display text-[22px] uppercase leading-none tracking-tight text-encre">Paramètres</span>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-mute">Profil · Confidentialité · Compte</span>
        </div>
      </header>

      <ProfileForm
        avatarUrl={user.avatarUrl}
        initial={{
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          bio: user.bio,
          defaultPublishAs: user.defaultPublishAs === "ANONYMOUS" ? "USERNAME" : user.defaultPublishAs,
          listedInDirectory: user.listedInDirectory,
          showJoinDate: user.showJoinDate,
        }}
        onSave={saveProfile}
        onAvatarChange={changeAvatar}
      />
      <DangerZone onSignOut={() => void signOutAndRedirect()} onDelete={() => void requestDeletion()} />
    </div>
  );
}
