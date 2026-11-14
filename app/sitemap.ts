import type { MetadataRoute } from "next";
import { listFeed, listThemes } from "@/lib/server/repository";
import { env } from "@/lib/env";

/** Génère le sitemap XML sans auto-appel HTTP pendant le pré-rendu. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const feed = await listFeed({ limit: 50, viewerId: null, sort: "recent" });
  const themes = await listThemes();
  const base = env.APP_URL.replace(/\/$/, "");

  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/themes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/auteurs`, changeFrequency: "weekly", priority: 0.7 },
    ...themes.map((theme) => ({ url: `${base}/themes/${theme.id}`, priority: 0.7 })),
    ...feed.items.map((post) => ({ url: `${base}/mots/${post.id}`, priority: 0.8 })),
  ];
}
