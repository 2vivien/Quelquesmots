"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { openAuthPopup } from "@/lib/open-auth";
import { DangerZone, ProfileForm, useSettings } from "@/features/settings";

/** Page des paramètres de profil et confidentialité (écran 11). */
export default function SettingsPage() {
  const { user, saveProfile, changeAvatar, signOutAndRedirect, requestDeletion } = useSettings();

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-4">
        <p className="font-serif text-2xl text-encre">Connexion requise</p>
        <button type="button" onClick={openAuthPopup} className="inline-flex min-h-[44px] items-center rounded-full bg-encre-fort px-6 text-sm text-ivoire">
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Retour" className="text-encre hover:opacity-70">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <h1 className="font-serif text-3xl text-encre">Mon profil</h1>
      </div>
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
