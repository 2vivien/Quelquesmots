"use client";

import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";

/** Utilisateur connecté par défaut pour le mode démonstration/maquette. */
export const DEFAULT_MOCK_USER: AuthUser = {
  id: "user-emma",
  username: "em.mots",
  firstName: "Emma",
  lastName: "Martin",
  bio: "Une lectrice, une rêveuse.",
  avatarUrl: "/images/editorial/avatar-emma.jpg",
  defaultPublishAs: "USERNAME",
  listedInDirectory: true,
  showJoinDate: true,
  role: "admin",
  onboarded: true,
};

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setHydrated: () => void;
}

/** Store Zustand de l'état de session client. La session démarre en invité (connexion obligatoire). */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: () => set({ hydrated: true }),
}));
