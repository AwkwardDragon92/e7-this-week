import { revalidatePath } from "next/cache";
import { getSql } from "@/lib/db";
import { isAdmin, isHttpUrl, json, noDb, readBody, str, unauthorized } from "@/lib/http";

/** GET: sponsors, their weeks, clicks, and inquiries. */
export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const sponsors = await sql`SELECT s.*, (SELECT count(*)::int FROM sponsor_clicks c WHERE c.sponsor_id = s.id) AS clicks FROM sponsors s ORDER BY s.created_at DESC`;
  const weeks = await sql`SELECT w.*, s.slug, (SELECT count(*)::int FROM sponsor_clicks c WHERE c.sponsor_id = w.sponsor_id AND c.created_at BETWEEN w.starts_at AND w.ends_at) AS clicks
    FROM sponsor_weeks w JOIN sponsors s ON s.id = w.sponsor_id ORDER BY w.starts_at DESC LIMIT 100`;
  const inquiries = await sql`SELECT * FROM sponsor_inquiries ORDER BY created_at DESC LIMIT 100`;
  return json({ sponsors, weeks, inquiries });
}

/**
 * POST { slug, name, url, week?: { starts_at, ends_at, message, cta?, price_usd? } }
 * Upserts the sponsor and optionally books a week. The site bar and email slot read the active week.
 */
export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const body = await readBody(req);
  const slug = str(body.slug, 60)?.toLowerCase();
  const name = str(body.name, 120);
  const url = str(body.url, 500);
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || !name || !isHttpUrl(url)) {
    return json({ error: "need { slug: a-z0-9-, name, url: https://... }" }, 400);
  }
  const [s] = await sql`INSERT INTO sponsors (slug, name, url) VALUES (${slug}, ${name}, ${url})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url RETURNING *`;
  let week = null;
  const w = body.week as Record<string, unknown> | undefined;
  if (w && typeof w === "object") {
    const starts = str(w.starts_at, 40);
    const ends = str(w.ends_at, 40);
    const message = str(w.message, 200);
    if (!starts || !ends || !message || Number.isNaN(Date.parse(starts)) || Number.isNaN(Date.parse(ends))) {
      return json({ error: "week needs starts_at, ends_at (ISO) and message" }, 400);
    }
    const price = w.price_usd == null ? null : Number(w.price_usd);
    [week] = await sql`INSERT INTO sponsor_weeks (sponsor_id, starts_at, ends_at, message, cta, price_usd)
      VALUES (${s.id}, ${starts}, ${ends}, ${message}, ${str(w.cta, 40)}, ${price}) RETURNING *`;
  }
  revalidatePath("/", "layout");
  return json({ ok: true, sponsor: s, week });
}
