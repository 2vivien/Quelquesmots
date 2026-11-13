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
  async signInWithGoogle(asNewUser?: boolean): Promise<AuthUser> {
    window.location.href = asNewUser ? "/api/auth/signin/google?as=new" : "/api/auth/signin/google";
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
    if (!res.ok) {
      let message = "Impossible de mettre à jour le profil.";
      try {
        const data = (await res.json()) as { error?: { message?: string } };
        if (data?.error?.message) message = data.error.message;
      } catch {
        // Corps non JSON : message par défaut.
      }
      throw new Error(message);
    }
    const data = (await res.json()) as { user: AuthUser };
    return data.user;
  },
  async deleteAccount(): Promise<void> {
    const res = await fetch(apiUrl("/api/settings/account"), { method: "DELETE" });
    if (!res.ok) {
      let message = "Impossible de supprimer le compte.";
      try {
        const data = (await res.json()) as { error?: { message?: string } };
        if (data?.error?.message) message = data.error.message;
      } catch {
        // Corps non JSON : message par défaut.
      }
      throw new Error(message);
    }
  },
};
