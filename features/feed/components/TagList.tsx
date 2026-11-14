import Link from "next/link";

export interface TagListItem {
  id: string;
  label: string;
}

interface TagListProps {
  tags: TagListItem[];
  pill?: boolean;
}

/**
 * Liste de tags éditoriaux cliquables (#vie #résilience).
 * @param props Liste des tags (id + libellé) et variante optionnelle en pilule.
 */
export function TagList({ tags, pill = false }: TagListProps) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tags/${tag.id}`}
          className={
            pill
              ? "puce text-[12px]"
              : "text-[13px] font-semibold text-muted transition-colors hover:text-encre"
          }
        >
          #{tag.label}
        </Link>
      ))}
    </div>
  );
}
