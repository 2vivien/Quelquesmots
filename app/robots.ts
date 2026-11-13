import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** Configuration robots.txt excluant les routes privées et d'administration. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/themes", "/auteurs", "/mots"],
      disallow: ["/studio", "/bibliotheque", "/notifications", "/parametres", "/admin", "/api"],
    },
    sitemap: `${env.APP_URL}/sitemap.xml`,
  };
}
