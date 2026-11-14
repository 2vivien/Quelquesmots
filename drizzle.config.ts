import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_MIGRATION_URL;
if (!url) {
  throw new Error("DATABASE_MIGRATION_URL est requis pour générer/vérifier les migrations Drizzle.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url },
  migrations: {
    schema: "drizzle",
    table: "__drizzle_migrations",
  },
  strict: true,
  verbose: true,
});
