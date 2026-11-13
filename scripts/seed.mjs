// Upserts data/*.json (sourced seed data) into Postgres. Usage: npm run db:seed
import postgres from "postgres";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (put it in .env.local or the environment).");
  process.exit(1);
}
const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), "utf8"));
const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const codes = load("codes");
  for (const c of codes) {
    await sql`
      INSERT INTO codes (code, rewards, status, found_at, expires_at, source_name, source_url, note)
      VALUES (${c.code}, ${c.rewards}, ${c.status}, ${c.found_at}, ${c.expires_at}, ${c.source_name}, ${c.source_url}, ${c.note})
      ON CONFLICT (code) DO UPDATE SET rewards = EXCLUDED.rewards, status = EXCLUDED.status,
        found_at = EXCLUDED.found_at, expires_at = EXCLUDED.expires_at, source_name = EXCLUDED.source_name,
        source_url = EXCLUDED.source_url, note = EXCLUDED.note, updated_at = now()`;
  }
  const banners = load("banners");
  for (const b of banners) {
    await sql`
      INSERT INTO banners (id, title, type, hero, artifact, element, hero_class, starts_at, ends_at, time_precision, notice_url, source_url)
      VALUES (${b.id}, ${b.title}, ${b.type}, ${b.hero}, ${b.artifact}, ${b.element}, ${b.hero_class}, ${b.starts_at}, ${b.ends_at}, ${b.time_precision}, ${b.notice_url}, ${b.source_url})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, hero = EXCLUDED.hero,
        artifact = EXCLUDED.artifact, element = EXCLUDED.element, hero_class = EXCLUDED.hero_class,
        starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, time_precision = EXCLUDED.time_precision,
        notice_url = EXCLUDED.notice_url, source_url = EXCLUDED.source_url, updated_at = now()`;
  }
  const events = load("events");
  for (const e of events) {
    await sql`
      INSERT INTO events (id, name, kind, description, rewards, starts_at, ends_at, time_precision, source_url)
      VALUES (${e.id}, ${e.name}, ${e.kind}, ${e.description}, ${e.rewards}, ${e.starts_at}, ${e.ends_at}, ${e.time_precision}, ${e.source_url})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind, description = EXCLUDED.description,
        rewards = EXCLUDED.rewards, starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at,
        time_precision = EXCLUDED.time_precision, source_url = EXCLUDED.source_url, updated_at = now()`;
  }
  console.log(`seeded ${codes.length} codes, ${banners.length} banners, ${events.length} events`);
} finally {
  await sql.end();
}
