import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatCount } from "@/lib/format";
import type { AuthorProfile } from "../types/authors.types";
import { AuthorAvatar } from "./AuthorAvatar";

interface AuthorRowProps {
  author: AuthorProfile;
}

/**
 * Ligne d'auteur pour l'annuaire et les résultats de recherche.
 * @param props Profil de l'auteur à afficher.
 */
export function AuthorRow({ author }: AuthorRowProps) {
  return (
    <Link
      href={`/auteurs/${author.username}`}
      className="group flex items-center justify-between gap-4 border-b border-bord py-4 transition-colors hover:bg-carte/70 focus-visible:outline-none"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <AuthorAvatar src={author.avatarUrl} alt={author.username} size={44} />
        <div className="min-w-0">
          <p className="truncate font-medium text-encre group-hover:underline">
            {author.username}
          </p>
          <p className="text-[13px] tabular-nums text-muted">
            {formatCount(author.postCount)} publications · {formatCount(author.followersCount)} suivis
          </p>
        </div>
      </div>
      <ChevronRight
        size={18}
        strokeWidth={1.5}
        className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-encre"
        aria-hidden="true"
      />
    </Link>
  );
}
