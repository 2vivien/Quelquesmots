"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { openAuthPopup } from "@/lib/open-auth";
import { useAuth } from "@/features/auth";
import { authService } from "@/features/auth/services/auth.service";
import { profileSchema, type ProfileFormValues } from "../schemas/profile.schema";

/**
 * Hook de sauvegarde du profil, changement de photo, déconnexion et demande de suppression.
 * @returns Utilisateur courant et actions de mise à jour/suppression/déconnexion.
 */
export function useSettings() {
  const { user, updateUser, signOut } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const saveProfile = async (values: ProfileFormValues): Promise<boolean> => {
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides.");
      return false;
    }
    try {
      await updateUser(parsed.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de mettre à jour le profil.");
      return false;
    }
    toast.success("Profil mis à jour");
    return true;
  };

  const changeAvatar = async (avatarUrl: string): Promise<void> => {
    try {
      await updateUser({ avatarUrl });
      // Invalide les caches qui affichent l'avatar de l'auteur (mur, commentaires, notifications).
      for (const key of ["feed", "comments", "notifications", "interactions", "library"]) {
        void qc.invalidateQueries({ queryKey: [key] });
      }
      toast.success("Photo de profil mise à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de changer la photo.");
    }
  };

  const signOutAndRedirect = async (): Promise<void> => {
    await signOut();
    router.push("/");
    openAuthPopup();
  };

  const requestDeletion = async (): Promise<void> => {
    try {
      await authService.deleteAccount();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de supprimer le compte.");
      return;
    }
    await signOut();
    toast.success("Demande enregistrée (suppression sous 14 jours).");
    router.push("/");
    openAuthPopup();
  };

  return { user, saveProfile, changeAvatar, signOutAndRedirect, requestDeletion };
}
