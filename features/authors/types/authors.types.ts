import type { PublishAs } from "@/types";

/** Profil public d'un auteur exposé sur l'annuaire et les cartes. */
export interface AuthorProfile {
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio: string;
  avatarUrl: string;
  defaultPublishAs: PublishAs;
  listedInDirectory: boolean;
  showJoinDate: boolean;
  postCount: number;
  followersCount: number;
  joinedAt: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
}

/** Paramètres minimaux pour calculer le nom affiché d'un auteur. */
export interface DisplayAuthorInput {
  publishAs: PublishAs;
  username: string;
  firstName?: string;
  lastName?: string;
}

/** Contrat du service des auteurs. */
export interface AuthorsService {
  listDirectory(query?: string): Promise<AuthorProfile[]>;
  getByUsername(username: string): Promise<AuthorProfile | null>;
  isUsernameAvailable(username: string): Promise<boolean>;
}
