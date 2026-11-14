import type { MetadataRoute } from "next";
import { postsService } from "@/features/posts";
import { themesService } from "@/features/themes";
import { env } from "@/lib/env";

/** Génère le sitemap XML des pages publiques, thèmes et textes publics. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [feed, themes] = await Promise.all([
    postsService.listFeed({ limit: 50, viewerId: null }),
    themesService.listActive(),
  ]);
  const base = env.APP_URL;
  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/themes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/auteurs`, changeFrequency: "weekly", priority: 0.7 },
    ...themes.map((t) => ({ url: `${base}/themes/${t.id}`, priority: 0.7 })),
    ...feed.items.map((p) => ({ url: `${base}/mots/${p.id}`, priority: 0.8 })),
  ];
}
