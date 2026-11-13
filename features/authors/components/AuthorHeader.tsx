import { FollowButton, FollowerCount } from "@/features/interactions";
import { formatCount } from "@/lib/format";
import type { AuthorProfile } from "../types/authors.types";
import { AuthorAvatar } from "./AuthorAvatar";

interface AuthorHeaderProps {
  author: AuthorProfile;
  actions?: React.ReactNode;
}

/**
 * En-tête éditorial du profil public d'un auteur avec nombre de suivis et bouton Suivre.
 * @param props Profil de l'auteur et actions facultatives.
 */
export function AuthorHeader({ author, actions }: AuthorHeaderProps) {
  const joined = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(author.joinedAt));

  return (
    <header className="flex flex-col gap-5 border-b border-bord pb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-5">
        <AuthorAvatar src={author.avatarUrl} alt={author.username} size={88} ring />
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-encre">{author.username}</h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-encre/90">{author.bio}</p>
          <p className="text-[13px] tabular-nums text-muted">
            {formatCount(author.postCount)} publications · <FollowerCount targetUserId={author.userId} baseCount={author.followersCount} />
            {author.showJoinDate ? ` · Membre depuis ${joined}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <FollowButton targetUserId={author.userId} authorLabel={author.username} variant="profile" />
        {actions}
      </div>
    </header>
  );
}
