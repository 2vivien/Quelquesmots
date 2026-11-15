/**
 * Seed de référence éditoriale (idempotent) :
 *  - 55 thèmes du catalogue littéraire (identifiants UUID générés par la base)
 *  - 12 tags approuvés
 * À exécuter quand la base est vide ou pour réconcilier après un rollback :
 *   DATABASE_URL=… bun run scripts/seed-reference.ts
 * Correspondance par libellé (insensible à la casse) ; ne crée aucun compte ni aucune publication.
 */
import { readFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { THEME_SEEDS } from "./data/themes";
import { invalidateCatalog } from "../lib/server/catalog-cache";

const TARGET_TAGS = [
  { label: "amour" },
  { label: "vie" },
  { label: "résilience" },
  { label: "solitude" },
  { label: "espoir" },
  { label: "souvenirs" },
  { label: "absence" },
  { label: "mémoire" },
  { label: "littérature" },
  { label: "passion" },
  { label: "relation" },
  { label: "cœur" },
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
    // Thèmes : insertion si absents (correspondance par libellé, insensible à la casse) ; sinon mise à jour.
    for (let idx = 0; idx < THEME_SEEDS.length; idx += 1) {
      const [name, category, tagline] = THEME_SEEDS[idx]!;
      const existing = await pool.query("select id from themes where lower(name) = lower($1) limit 1", [name]);
      if (existing.rows[0]) {
        await pool.query(
          "update themes set category = $1, tagline = $2, position = $3, active = true, updated_at = now() where id = $4",
          [category, tagline, idx + 1, existing.rows[0].id],
        );
      } else {
        await pool.query(
          "insert into themes (id, name, category, tagline, position, active) values (gen_random_uuid(), $1, $2, $3, $4, true)",
          [name, category, tagline, idx + 1],
        );
      }
    }

    // Tags approuvés : insertion si absents (correspondance par libellé, insensible à la casse).
    for (const tag of TARGET_TAGS) {
      const existing = await pool.query("select id from tags where lower(label) = lower($1) limit 1", [tag.label]);
      if (existing.rows[0]) {
        await pool.query(
          "update tags set status = 'APPROVED', updated_at = now() where id = $1",
          [existing.rows[0].id],
        );
      } else {
        await pool.query(
          "insert into tags (id, label, status) values (gen_random_uuid(), $1, 'APPROVED')",
          [tag.label],
        );
      }
    }

    const themeCount = (await pool.query("select count(*)::int as c from themes")).rows[0].c;
    const tagCount = (await pool.query("select count(*)::int as c from tags")).rows[0].c;
    await invalidateCatalog();
    console.log(`Seed OK — ${themeCount} thèmes, ${tagCount} tags.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed FAILED", err);
  process.exit(1);
});
