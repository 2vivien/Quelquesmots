"use client";

import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { upsertMockAuthor } from "@/features/authors";
import { profileSchema, type ProfileFormValues } from "../schemas/profile.schema";

/**
 * Hook de sauvegarde du profil, export JSON et demande de suppression.
 * @returns Utilisateur courant et actions de mise à jour/export.
 */
export function useSettings() {
  const { user, updateUser, signOut } = useAuth();

  const saveProfile = async (values: ProfileFormValues): Promise<boolean> => {
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides.");
      return false;
    }
    await updateUser(parsed.data);
    if (user) {
      upsertMockAuthor({
        userId: user.id,
        username: parsed.data.username,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        bio: parsed.data.bio,
        avatarUrl: user.avatarUrl,
        defaultPublishAs: parsed.data.defaultPublishAs,
        listedInDirectory: parsed.data.listedInDirectory,
        showJoinDate: parsed.data.showJoinDate,
        postCount: 14,
        followersCount: 48,
        joinedAt: "2025-05-20T10:00:00.000Z",
        status: "ACTIVE",
      });
    }
    toast.success("Profil mis à jour");
    return true;
  };

  const exportData = (): void => {
    if (!user) return;
    const blob = new Blob([JSON.stringify({ user, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quelques-mots-${user.username}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export JSON téléchargé");
  };

  const requestDeletion = async (): Promise<void> => {
    await signOut();
    toast.success("Demande enregistrée (suppression sous 14 jours).");
  };

  return { user, saveProfile, exportData, requestDeletion };
}
