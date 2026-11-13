import { getSql } from "@/lib/db";
import { getBanners, getCodes, getEvents } from "@/lib/data";
import { isAdmin, json, unauthorized } from "@/lib/http";

/**
 * Raw data for the weekly newsletter (scripts/newsletter.mjs renders it).
 * Served from production so the issue is built from the live database.
 */
export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  const [codes, banners, events] = await Promise.all([getCodes(), getBanners(), getEvents()]);
  let sponsors: readonly unknown[] = [];
  let rerunDemand: readonly unknown[] = [];
  if (sql) {
    sponsors = await sql`
      SELECT s.slug, s.name, w.message, w.cta, w.starts_at, w.ends_at
      FROM sponsor_weeks w JOIN sponsors s ON s.id = w.sponsor_id
      WHERE w.ends_at > now() ORDER BY w.starts_at ASC LIMIT 10`;
    rerunDemand = await sql`
      SELECT hero, count(*)::int AS watchers FROM rerun_alerts
      WHERE notified_at IS NULL GROUP BY hero ORDER BY watchers DESC LIMIT 10`;
  }
  return json({ source: sql ? "db" : "json", generated_at: new Date().toISOString(), codes, banners, events, sponsors, rerunDemand });
}
