import { apiErrorMessage } from "@/lib/api-errors";
import { apiUrl } from "@/lib/env";
import type { TagItem, TagsService } from "../types/tags.types";

/** Implémentation réelle du service de tags via API. */
export const tagsReal: TagsService = {
  async listPopular(): Promise<TagItem[]> {
    const res = await fetch(apiUrl("/api/tags"));
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de charger les tags."));
    const data = (await res.json()) as { tags: TagItem[] };
    return data.tags;
  },
  async suggestFromText(text: string): Promise<string[]> {
    const res = await fetch(apiUrl("/api/tags/suggest"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de proposer des tags."));
    const data = (await res.json()) as { suggestions: string[] };
    return data.suggestions;
  },
  async getBySlug(slug: string): Promise<TagItem | null> {
    const res = await fetch(apiUrl(`/api/tags/${encodeURIComponent(slug)}`));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await apiErrorMessage(res, "Impossible de charger ce tag."));
    const data = (await res.json()) as { tag: TagItem | null };
    return data.tag;
  },
};
