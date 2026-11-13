"use client";

import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";

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
