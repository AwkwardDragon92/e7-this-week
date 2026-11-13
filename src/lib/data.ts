import "server-only";
import codesJson from "../../data/codes.json";
import bannersJson from "../../data/banners.json";
import eventsJson from "../../data/events.json";
import metaJson from "../../data/meta.json";
import { getSql, logError } from "./db";
import type { Banner, Code, GameEvent, LimitedHero, SponsorSlot } from "./types";

const toIso = (v: unknown): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString();

export const meta = metaJson as {
  checked: string;
  sources: { name: string; url: string; used_for: string }[];
};

/** Status is recomputed at read time so a code past its end date is never shown as working. */
function withLiveStatus(c: Code, now = Date.now()): Code {
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { ...c, status: "expired" };
  return c;
}

const statusRank = { active: 0, unconfirmed: 1, expired: 2 } as const;

function sortCodes(list: Code[]) {
  return list.sort((a, b) => {
    const s = statusRank[a.status] - statusRank[b.status];
    if (s) return s;
    return (b.found_at ?? "").localeCompare(a.found_at ?? "");
  });
}

export async function getCodes(): Promise<Code[]> {
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`SELECT code, rewards, status, found_at, expires_at, source_name, source_url, note FROM codes`;
      return sortCodes(
        rows.map((r) =>
          withLiveStatus({
            code: r.code,
            rewards: r.rewards,
            status: r.status,
            found_at: toIso(r.found_at),
            expires_at: toIso(r.expires_at),
            source_name: r.source_name,
            source_url: r.source_url,
            note: r.note,
          }),
        ),
      );
    } catch (e) {
      await logError("data.getCodes", e);
    }
  }
  return sortCodes((codesJson as Code[]).map((c) => withLiveStatus(c)));
}

export async function getBanners(): Promise<Banner[]> {
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`SELECT id, title, type, hero, artifact, element, hero_class, starts_at, ends_at, time_precision, notice_url, source_url FROM banners ORDER BY starts_at DESC`;
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        hero: r.hero,
        artifact: r.artifact,
        element: r.element,
        hero_class: r.hero_class,
        starts_at: toIso(r.starts_at)!,
        ends_at: toIso(r.ends_at),
        time_precision: r.time_precision,
        notice_url: r.notice_url,
        source_url: r.source_url,
      }));
    } catch (e) {
      await logError("data.getBanners", e);
    }
  }
  return [...(bannersJson as Banner[])].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
}

export async function getEvents(): Promise<GameEvent[]> {
  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`SELECT id, name, kind, description, rewards, starts_at, ends_at, time_precision, source_url FROM events`;
      return sortEvents(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          kind: r.kind,
          description: r.description,
          rewards: r.rewards,
          starts_at: toIso(r.starts_at),
          ends_at: toIso(r.ends_at),
          time_precision: r.time_precision,
          source_url: r.source_url,
        })),
      );
    } catch (e) {
      await logError("data.getEvents", e);
    }
  }
  return sortEvents([...(eventsJson as GameEvent[])]);
}

function sortEvents(list: GameEvent[]) {
  return list.sort((a, b) => (a.ends_at ?? "9999").localeCompare(b.ends_at ?? "9999"));
}

/** Banner phase relative to now. Date-only end dates count as running through that day (UTC). */
export function bannerPhase(b: { starts_at: string; ends_at: string | null; time_precision: string }, now = Date.now()) {
  const start = new Date(b.starts_at).getTime();
  let end = b.ends_at ? new Date(b.ends_at).getTime() : Infinity;
  if (b.time_precision === "date" && b.ends_at) end += 24 * 3600 * 1000 - 1;
  if (now < start) return "upcoming" as const;
  if (now <= end) return "current" as const;
  return "past" as const;
}

export function eventIsLive(e: GameEvent, now = Date.now()) {
  const start = e.starts_at ? new Date(e.starts_at).getTime() : -Infinity;
  let end = e.ends_at ? new Date(e.ends_at).getTime() : Infinity;
  if (e.time_precision === "date" && e.ends_at) end += 24 * 3600 * 1000 - 1;
  return now >= start && now <= end;
}

export function limitedHeroes(banners: Banner[]): LimitedHero[] {
  const map = new Map<string, LimitedHero>();
  for (const b of banners) {
    if (b.type !== "limited" || !b.hero) continue;
    const cur = map.get(b.hero);
    if (!cur) {
      map.set(b.hero, {
        hero: b.hero,
        element: b.element,
        hero_class: b.hero_class,
        runs: 1,
        last_start: b.starts_at,
        last_end: b.ends_at,
        last_notice_url: b.notice_url,
      });
    } else {
      cur.runs += 1;
      if (b.starts_at > cur.last_start) {
        cur.last_start = b.starts_at;
        cur.last_end = b.ends_at;
        cur.last_notice_url = b.notice_url;
      }
    }
  }
  return [...map.values()].sort((a, b) => (a.last_end ?? a.last_start).localeCompare(b.last_end ?? b.last_start));
}

export async function getActiveSponsor(): Promise<SponsorSlot | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT w.id AS week_id, s.slug, s.name, w.message, w.cta, w.ends_at
      FROM sponsor_weeks w JOIN sponsors s ON s.id = w.sponsor_id
      WHERE now() >= w.starts_at AND now() < w.ends_at
      ORDER BY w.starts_at DESC LIMIT 1`;
    if (!rows.length) return null;
    const r = rows[0];
    return { week_id: r.week_id, slug: r.slug, name: r.name, message: r.message, cta: r.cta, ends_at: toIso(r.ends_at)! };
  } catch (e) {
    await logError("data.getActiveSponsor", e);
    return null;
  }
}

export async function getPublicStats(): Promise<{ subscribers: number; pageviews30d: number } | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const [s] = await sql`SELECT count(*)::int AS n FROM signups WHERE NOT unsubscribed`;
    const [p] = await sql`SELECT count(*)::int AS n FROM pageviews WHERE created_at > now() - interval '30 days'`;
    return { subscribers: s.n, pageviews30d: p.n };
  } catch (e) {
    await logError("data.getPublicStats", e);
    return null;
  }
}
