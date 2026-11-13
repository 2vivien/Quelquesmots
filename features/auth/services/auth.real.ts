import { apiUrl } from "@/lib/env";
import type { AuthService, AuthUser } from "../types/auth.types";

/** Implémentation réelle du service d'authentification (Better Auth). */
export const authReal: AuthService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const res = await fetch(apiUrl("/api/auth/session"));
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser | null };
    return data.user;
  },
  async signInWithGoogle(): Promise<AuthUser> {
    window.location.href = "/api/auth/signin/google";
    throw new Error("Redirection vers Google en cours");
  },
  async signOut(): Promise<void> {
    await fetch(apiUrl("/api/auth/signout"), { method: "POST" });
  },
  async updateSessionUser(patch: Partial<AuthUser>): Promise<AuthUser | null> {
    const res = await fetch(apiUrl("/api/settings/profile"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: AuthUser };
    return data.user;
  },
};
