// Runs every migrations/*.sql file once, in order. Usage: npm run db:migrate
import postgres from "postgres";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL || process.env.POSTGRES_URL;
const optional = process.argv.includes("--optional");
if (!url) {
  if (optional) {
    console.log("No DATABASE_URL; skipping (site will use data/*.json).");
    process.exit(0);
  }
  console.error("DATABASE_URL is not set (put it in .env.local or the environment).");
  process.exit(1);
}
const sql = postgres(url, { max: 1, onnotice: () => {} });
const dir = join(process.cwd(), "migrations");
try {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  const done = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    console.log("applying", file);
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(dir, file), "utf8"));
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
  }
  console.log("migrations up to date");
} finally {
  await sql.end();
}
