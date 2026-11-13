import type { PublishAs, UserRole } from "@/types";

/** Session utilisateur active sur Quelques mots. */
export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatarUrl: string;
  defaultPublishAs: PublishAs;
  listedInDirectory: boolean;
  showJoinDate: boolean;
  role: UserRole;
  onboarded: boolean;
}

/** Contrat du service d'authentification. */
export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithGoogle(asNewUser?: boolean): Promise<AuthUser>;
  signOut(): Promise<void>;
  updateSessionUser(patch: Partial<AuthUser>): Promise<AuthUser | null>;
  /** Supprime définitivement le compte courant (contenu anonymisé/effacé). */
  deleteAccount(): Promise<void>;
}
