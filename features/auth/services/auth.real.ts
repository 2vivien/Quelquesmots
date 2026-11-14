import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { AuthService, AuthUser } from "../types/auth.types";

/** Implémentation réelle du service d'authentification via les routes de session personnalisées. */
export const authReal: AuthService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const res = await fetch(apiUrl("/api/auth/session"));
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de vérifier la session."));
    const data = (await res.json()) as { user: AuthUser | null };
    return data.user;
  },
  async signInWithGoogle(asNewUser?: boolean): Promise<AuthUser> {
    window.location.href = asNewUser ? "/api/auth/signin/google?as=new" : "/api/auth/signin/google";
    throw new Error("Redirection vers Google en cours");
  },
  async signOut(): Promise<void> {
    const res = await fetch(apiUrl("/api/auth/signout"), { method: "POST" });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de fermer la session."));
  },
  async updateSessionUser(patch: Partial<AuthUser>): Promise<AuthUser | null> {
    const res = await fetch(apiUrl("/api/settings/profile"), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de mettre à jour le profil."));
    const data = (await res.json()) as { user: AuthUser };
    return data.user;
  },
  async deleteAccount(): Promise<void> {
    const res = await fetch(apiUrl("/api/settings/account"), { method: "DELETE" });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de supprimer le compte."));
  },
};
