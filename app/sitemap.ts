import type { MetadataRoute } from "next";
import { listFeed, listThemes } from "@/lib/server/repository";
import { env } from "@/lib/env";

// Contenu live : jamais de pré-rendu au build (la CI n'a pas de base Neon).
export const dynamic = "force-dynamic";

/** Génère le sitemap XML ; en cas de panne de base, ne sert que les entrées statiques. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL.replace(/\/$/, "");
  try {
    const feed = await listFeed({ limit: 50, viewerId: null, sort: "recent" });
    const themes = await listThemes();
    return [
      { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
      { url: `${base}/themes`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${base}/auteurs`, changeFrequency: "weekly", priority: 0.7 },
      ...themes.map((theme) => ({ url: `${base}/themes/${theme.id}`, priority: 0.7 })),
      ...feed.items.map((post) => ({ url: `${base}/mots/${post.id}`, priority: 0.8 })),
    ];
  } catch (error) {
    console.error("Sitemap : base indisponible, repli sur les entrées statiques.", error);
    return [
      { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
      { url: `${base}/themes`, changeFrequency: "weekly", priority: 0.8 },
      { url: `${base}/auteurs`, changeFrequency: "weekly", priority: 0.7 },
    ];
  }
}
