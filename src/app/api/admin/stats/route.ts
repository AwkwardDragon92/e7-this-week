import { getSql } from "@/lib/db";
import { isAdmin, json, noDb, unauthorized } from "@/lib/http";

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const [counts] = await sql`SELECT
      (SELECT count(*)::int FROM signups WHERE NOT unsubscribed) AS subscribers,
      (SELECT count(*)::int FROM signups WHERE created_at > now() - interval '7 days') AS new_subscribers_7d,
      (SELECT count(*)::int FROM pageviews WHERE created_at > now() - interval '1 day') AS pageviews_24h,
      (SELECT count(*)::int FROM pageviews WHERE created_at > now() - interval '7 days') AS pageviews_7d,
      (SELECT count(*)::int FROM pageviews WHERE created_at > now() - interval '30 days') AS pageviews_30d,
      (SELECT count(*)::int FROM rerun_alerts WHERE notified_at IS NULL) AS rerun_alerts_open,
      (SELECT count(*)::int FROM submissions WHERE status = 'pending') AS pending_submissions,
      (SELECT count(*)::int FROM sponsor_inquiries WHERE created_at > now() - interval '30 days') AS sponsor_inquiries_30d,
      (SELECT count(*)::int FROM sponsor_clicks WHERE created_at > now() - interval '30 days') AS sponsor_clicks_30d,
      (SELECT count(*)::int FROM errors WHERE created_at > now() - interval '1 day') AS errors_24h`;
  const topPages = await sql`SELECT path, count(*)::int AS views FROM pageviews WHERE created_at > now() - interval '30 days' GROUP BY path ORDER BY views DESC LIMIT 20`;
  const referrers = await sql`SELECT coalesce(referrer, '(direct)') AS referrer, count(*)::int AS views FROM pageviews WHERE created_at > now() - interval '30 days' GROUP BY 1 ORDER BY views DESC LIMIT 20`;
  const daily = await sql`SELECT date_trunc('day', created_at)::date AS day, count(*)::int AS views FROM pageviews WHERE created_at > now() - interval '30 days' GROUP BY 1 ORDER BY 1`;
  const rerunDemand = await sql`SELECT hero, count(*)::int AS waiting FROM rerun_alerts WHERE notified_at IS NULL GROUP BY hero ORDER BY waiting DESC LIMIT 20`;
  const recentErrors = await sql`SELECT source, message, path, created_at FROM errors ORDER BY created_at DESC LIMIT 20`;
  return json({ ...counts, topPages, referrers, daily, rerunDemand, recentErrors });
}
