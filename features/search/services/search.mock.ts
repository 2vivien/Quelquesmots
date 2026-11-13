import { authorsService } from "@/features/authors";
import { postsService } from "@/features/posts";
import { tagsService } from "@/features/tags";
import { themesService } from "@/features/themes";
import { formatCount } from "@/lib/format";
import type { SearchResponse, SearchResultItem, SearchService, SearchTab } from "../types/search.types";
import { isFuzzyMatch } from "../utils/fuzzy";

/** Implémentation mock de la recherche globale multi-entités. */
export const searchMock: SearchService = {
  async search(query: string, tab: SearchTab, viewerId?: string | null): Promise<SearchResponse> {
    const [feed, themes, authors, tags] = await Promise.all([
      postsService.listFeed({ viewerId, limit: 50 }),
      themesService.listActive(),
      authorsService.listDirectory(),
      tagsService.listPopular(),
    ]);
    const items: SearchResultItem[] = [];
    if (tab === "all" || tab === "posts") {
      feed.items
        .filter((p) => isFuzzyMatch(`${p.title} ${p.excerpt} ${p.tagSlugs.join(" ")}`, query))
        .forEach((p) => items.push({ id: p.id, kind: "post", title: p.title, subtitle: `Par ${p.authorUsername} · 2 min`, href: `/mots/${p.slug}`, imageUrl: p.heroImageUrl }));
    }
    if (tab === "all" || tab === "themes") {
      themes
        .filter((t) => isFuzzyMatch(`${t.name} ${t.tagline}`, query))
        .forEach((t) => items.push({ id: t.id, kind: "theme", title: `Thème : ${t.name}`, subtitle: `${formatCount(t.postCount)} publications`, href: `/themes/${t.slug}` }));
    }
    if (tab === "all" || tab === "authors") {
      authors
        .filter((a) => isFuzzyMatch(`${a.username} ${a.bio}`, query))
        .forEach((a) => items.push({ id: a.userId, kind: "author", title: a.username, subtitle: `Auteur · ${formatCount(a.postCount)} publications`, href: `/auteurs/${a.username}`, imageUrl: a.avatarUrl }));
    }
    if (tab === "all" || tab === "tags") {
      tags
        .filter((g) => isFuzzyMatch(g.label, query))
        .forEach((g) => items.push({ id: g.slug, kind: "tag", title: `#${g.label}`, subtitle: `${formatCount(g.useCount)} textes`, href: `/tags/${g.slug}` }));
    }
    return { total: items.length, items };
  },
  async suggest(query: string, viewerId?: string | null): Promise<SearchResultItem[]> {
    if (query.trim().length < 2) return [];
    const res = await this.search(query, "all", viewerId);
    return res.items.slice(0, 5);
  },
};
