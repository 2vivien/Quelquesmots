import { FollowButton, FollowerCount } from "@/features/interactions";
import { formatCount } from "@/lib/format";
import type { AuthorProfile } from "../types/authors.types";
import { AuthorAvatar } from "./AuthorAvatar";
import { AuthorBanner } from "./AuthorBanner";

interface AuthorHeaderProps {
  author: AuthorProfile;
  actions?: React.ReactNode;
}

/**
 * En-tête du profil public : bannière illustrée rétro, avatar chevauchant,
 * identité et boîte de compteurs Publications / Followers.
 * La logique de suivi / signalement reste celle des composants existants.
 * @param props Profil de l'auteur et actions facultatives.
 */
export function AuthorHeader({ author, actions }: AuthorHeaderProps) {
  const joined = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(author.joinedAt));

  return (
    <div className="carte overflow-hidden">
      <AuthorBanner className="h-24 w-full border-b-[1.5px] border-bord sm:h-32" />

      <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="-mt-10 flex items-end justify-between gap-4 sm:-mt-12">
          <div className="rounded-full ring-[3px] ring-carte">
            <AuthorAvatar src={author.avatarUrl} alt={author.username} size={84} ring />
          </div>
          <div className="flex shrink-0 items-center gap-2 pb-1">
            <FollowButton targetUserId={author.userId} authorLabel={author.username} variant="profile" />
            {actions}
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <h1 className="font-display text-[26px] uppercase leading-[0.95] tracking-tight text-encre sm:text-[34px]">
            {author.username}
          </h1>
          <p className="text-[13px] font-medium text-muted">@{author.username}</p>
          {author.bio ? (
            <p className="max-w-xl text-[15px] leading-relaxed text-encre/90">{author.bio}</p>
          ) : null}
          {author.showJoinDate ? (
            <p className="text-[12px] tabular-nums text-muted">Membre depuis {joined}</p>
          ) : null}
        </div>

        {/* Compteurs dans une boîte à deux colonnes, comme sur la maquette */}
        <dl className="mt-5 grid grid-cols-2 divide-x-[1.5px] divide-bord rounded-[16px] border-[1.5px] border-bord bg-carte text-center shadow-[2px_2px_0_0_var(--color-encre)]">
          <div className="px-3 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Publications</dt>
            <dd className="font-display text-[22px] tabular-nums text-encre sm:text-[26px]">{formatCount(author.postCount)}</dd>
          </div>
          <div className="px-3 py-3">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">Followers</dt>
            <dd className="font-display text-[22px] tabular-nums text-encre sm:text-[26px]">
              <FollowerCount targetUserId={author.userId} baseCount={author.followersCount} label="" />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}