import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

const g = globalThis as unknown as { __e7sql?: Sql | null };

/** Returns a Postgres client, or null when DATABASE_URL is not configured. */
export function dbUrl() {
  return process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL || process.env.POSTGRES_URL || "";
}

export function getSql(): Sql | null {
  const url = dbUrl();
  if (!url) return null;
  if (g.__e7sql === undefined || g.__e7sql === null) {
    g.__e7sql = postgres(url, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // safe with Neon's pooled (pgbouncer) connection strings
      onnotice: () => {},
    });
  }
  return g.__e7sql;
}

export function hasDb() {
  return Boolean(dbUrl());
}

/** Best-effort error logging into the errors table. Never throws. */
export async function logError(source: string, err: unknown, path?: string) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack ?? null : null;
  console.error(`[${source}]`, message);
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`INSERT INTO errors (source, message, stack, path) VALUES (${source.slice(0, 100)}, ${message.slice(0, 2000)}, ${stack ? stack.slice(0, 8000) : null}, ${path ?? null})`;
  } catch {
    /* ignore */
  }
}
