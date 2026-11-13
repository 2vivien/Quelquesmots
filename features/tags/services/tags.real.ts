import { apiUrl } from "@/lib/env";
import type { TagItem, TagsService } from "../types/tags.types";

/** Implémentation réelle du service de tags via API. */
export const tagsReal: TagsService = {
  async listPopular(): Promise<TagItem[]> {
    const res = await fetch(apiUrl("/api/tags"));
    if (!res.ok) return [];
    const data = (await res.json()) as { tags: TagItem[] };
    return data.tags;
  },
  async suggestFromText(text: string): Promise<string[]> {
    const res = await fetch(apiUrl("/api/tags/suggest"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return ["Amour", "Solitude", "Vie", "Espoir"];
    const data = (await res.json()) as { suggestions: string[] };
    return data.suggestions;
  },
  async getBySlug(slug: string): Promise<TagItem | null> {
    const res = await fetch(apiUrl(`/api/tags/${encodeURIComponent(slug)}`));
    if (!res.ok) return null;
    const data = (await res.json()) as { tag: TagItem | null };
    return data.tag;
  },
};
