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
      href={`/auteurs/${author.userId}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-bord bg-carte px-4 py-4 shadow-[2px_2px_0_0_var(--color-encre)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-encre)] focus-visible:outline-none"
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
