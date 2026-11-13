import Link from "next/link";

interface TagListProps {
  tags: string[];
  pill?: boolean;
}

/**
 * Liste de tags éditoriaux cliquables (#vie #résilience).
 * @param props Liste des slugs de tags et variante optionnelle en pilule.
 */
export function TagList({ tags, pill = false }: TagListProps) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((slug) => (
        <Link
          key={slug}
          href={`/tags/${slug}`}
          className={
            pill
              ? "puce text-[12px]"
              : "text-[13px] font-semibold text-muted transition-colors hover:text-encre"
          }
        >
          #{slug}
        </Link>
      ))}
    </div>
  );
}
