"use client";

import { useEffect } from "react";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../stores/auth.store";
import type { AuthUser } from "../types/auth.types";

/**
 * Hook d'authentification exposant l'utilisateur courant et les actions de session.
 * @returns État de session, indicateur d'hydratation et actions Google / déconnexion.
 */
export function useAuth() {
  const { user, hydrated, setUser, setHydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated) return;
    authService.getCurrentUser().then((u) => {
      setUser(u);
      setHydrated();
    });
  }, [hydrated, setUser, setHydrated]);

  const signInWithGoogle = async (asNewUser = false): Promise<AuthUser> => {
    const u = await authService.signInWithGoogle(asNewUser);
    setUser(u);
    return u;
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    setUser(null);
  };

  const updateUser = async (patch: Partial<AuthUser>): Promise<void> => {
    const next = await authService.updateSessionUser(patch);
    setUser(next);
  };

  return { user, hydrated, signInWithGoogle, signOut, updateUser };
}
