import { normalizeSearchText } from "@/lib/format";
import type { TagItem, TagsService } from "../types/tags.types";

const MOCK_TAGS: TagItem[] = [
  { slug: "amour", label: "amour", useCount: 1248, status: "APPROVED" },
  { slug: "vie", label: "vie", useCount: 980, status: "APPROVED" },
  { slug: "resilience", label: "résilience", useCount: 642, status: "APPROVED" },
  { slug: "solitude", label: "solitude", useCount: 720, status: "APPROVED" },
  { slug: "espoir", label: "espoir", useCount: 540, status: "APPROVED" },
  { slug: "souvenirs", label: "souvenirs", useCount: 495, status: "APPROVED" },
  { slug: "absence", label: "absence", useCount: 410, status: "APPROVED" },
  { slug: "memoire", label: "mémoire", useCount: 380, status: "APPROVED" },
  { slug: "litterature", label: "littérature", useCount: 310, status: "APPROVED" },
  { slug: "passion", label: "passion", useCount: 290, status: "APPROVED" },
  { slug: "relation", label: "relation", useCount: 245, status: "APPROVED" },
  { slug: "coeur", label: "cœur", useCount: 230, status: "APPROVED" },
];

/** Implémentation mock du service de tags. */
export const tagsMock: TagsService = {
  async listPopular(): Promise<TagItem[]> {
    return MOCK_TAGS.filter((t) => t.status === "APPROVED");
  },
  async suggestFromText(text: string): Promise<string[]> {
    const norm = normalizeSearchText(text);
    const matched = MOCK_TAGS.filter((t) => norm.includes(t.slug)).map(
      (t) => t.label,
    );
    const defaults = ["Amour", "Solitude", "Vie", "Espoir"];
    return Array.from(new Set([...matched, ...defaults])).slice(0, 5);
  },
  async getBySlug(slug: string): Promise<TagItem | null> {
    const clean = normalizeSearchText(slug);
    return (
      MOCK_TAGS.find((t) => normalizeSearchText(t.slug) === clean) ?? null
    );
  },
};
