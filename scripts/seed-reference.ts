/**
 * Seed de référence éditoriale (idempotent) :
 *  - 55 thèmes du catalogue littéraire
 *  - 12 tags approuvés
 * À exécuter quand la base est vide ou pour réconcilier après un rollback :
 *   DATABASE_URL=… bun run scripts/seed-reference.ts
 */
import { readFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { THEME_SEEDS } from "./data/themes";

const TARGET_TAGS = [
  { slug: "amour", label: "amour" },
  { slug: "vie", label: "vie" },
  { slug: "resilience", label: "résilience" },
  { slug: "solitude", label: "solitude" },
  { slug: "espoir", label: "espoir" },
  { slug: "souvenirs", label: "souvenirs" },
  { slug: "absence", label: "absence" },
  { slug: "memoire", label: "mémoire" },
  { slug: "litterature", label: "littérature" },
  { slug: "passion", label: "passion" },
  { slug: "relation", label: "relation" },
  { slug: "coeur", label: "cœur" },
] as const;

async function main() {
  const env = Object.fromEntries(
    readFileSync(".env", "utf8")
      .split("\n")
      .flatMap((line) => {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)="(.*)"$/);
        return m ? [[m[1], m[2]]] : [];
      }),
  );
  const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL ?? env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ou DATABASE_MIGRATION_URL requis.");

  const pool = new Pool({ connectionString: url });
  try {
    // Thèmes : upsert par slug, id `theme-<slug>`.
    for (let idx = 0; idx < THEME_SEEDS.length; idx += 1) {
      const [slug, name, category, tagline] = THEME_SEEDS[idx]!;
      await pool.query(
        `INSERT INTO themes (id, slug, name, category, tagline, position, active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, tagline = EXCLUDED.tagline, position = EXCLUDED.position, active = true`,
        [`theme-${slug}`, slug, name, category, tagline, idx + 1],
      );
    }

    // Tags approuvés : upsert par slug.
    for (const tag of TARGET_TAGS) {
      await pool.query(
        `INSERT INTO tags (slug, label, status)
         VALUES ($1, $2, 'APPROVED')
         ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, status = 'APPROVED'`,
        [tag.slug, tag.label],
      );
    }

    const themeCount = (await pool.query("SELECT count(*)::int AS c FROM themes")).rows[0].c;
    const tagCount = (await pool.query("SELECT count(*)::int AS c FROM tags")).rows[0].c;
    console.log(`Seed OK — ${themeCount} thèmes, ${tagCount} tags.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed FAILED", err);
  process.exit(1);
});
