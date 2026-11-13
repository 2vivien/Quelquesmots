import type { AuthService, AuthUser } from "../types/auth.types";
import { DEFAULT_MOCK_USER } from "../stores/auth.store";

const STORAGE_KEY = "qm_mock_session_v1";

/** Session mock : invité tant qu'aucune connexion n'a eu lieu. */
function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw || raw === "null") return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, user ? JSON.stringify(user) : "null");
}

/** Implémentation mock du service d'authentification. */
export const authMock: AuthService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    return readStoredUser();
  },
  async signInWithGoogle(asNewUser = false): Promise<AuthUser> {
    const next: AuthUser = asNewUser
      ? {
          ...DEFAULT_MOCK_USER,
          id: "user-nouveau",
          username: "",
          bio: "",
          role: "user",
          onboarded: false,
        }
      : DEFAULT_MOCK_USER;
    writeStoredUser(next);
    return next;
  },
  async signOut(): Promise<void> {
    writeStoredUser(null);
  },
  async updateSessionUser(patch: Partial<AuthUser>): Promise<AuthUser | null> {
    const current = readStoredUser();
    if (!current) return null;
    const updated = { ...current, ...patch };
    writeStoredUser(updated);
    return updated;
  },
  async deleteAccount(): Promise<void> {
    // Mode maquette : efface simplement la session locale ; les données demo restent en mémoire.
    writeStoredUser(null);
  },
};
