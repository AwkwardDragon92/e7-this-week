import { revalidatePath } from "next/cache";
import { getSql } from "@/lib/db";
import { isAdmin, json, noDb, readBody, unauthorized } from "@/lib/http";

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null || v === "" ? null : String(v));

/**
 * POST { type: "codes" | "banners" | "events", items: [...] }
 * Same field names as data/*.json. Existing rows (by code / id) are updated.
 * POST { type: "codes", delete: ["CODE1"] } removes rows.
 */
export async function POST(req: Request) {
  if (!isAdmin(req)) return unauthorized();
  const sql = getSql();
  if (!sql) return noDb();
  const body = await readBody(req);
  const type = body.type;
  const items = (Array.isArray(body.items) ? body.items : []) as Row[];
  const del = (Array.isArray(body.delete) ? body.delete : []).map(String);
  if (!["codes", "banners", "events"].includes(String(type))) return json({ error: "type must be codes, banners or events" }, 400);
  let upserted = 0;
  try {
    await sql.begin(async (tx) => {
      for (const it of items) {
        if (type === "codes") {
          if (!s(it.code)) throw new Error("code is required");
          await tx`INSERT INTO codes (code, rewards, status, found_at, expires_at, source_name, source_url, note)
            VALUES (${s(it.code)}, ${s(it.rewards)}, ${s(it.status) ?? "active"}, ${s(it.found_at) ?? new Date().toISOString()}, ${s(it.expires_at)}, ${s(it.source_name)}, ${s(it.source_url)}, ${s(it.note)})
            ON CONFLICT (code) DO UPDATE SET rewards = EXCLUDED.rewards, status = EXCLUDED.status, found_at = EXCLUDED.found_at,
              expires_at = EXCLUDED.expires_at, source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, note = EXCLUDED.note, updated_at = now()`;
        } else if (type === "banners") {
          if (!s(it.id) || !s(it.title) || !s(it.type) || !s(it.starts_at)) throw new Error("banners need id, title, type, starts_at");
          await tx`INSERT INTO banners (id, title, type, hero, artifact, element, hero_class, starts_at, ends_at, time_precision, notice_url, source_url)
            VALUES (${s(it.id)}, ${s(it.title)}, ${s(it.type)}, ${s(it.hero)}, ${s(it.artifact)}, ${s(it.element)}, ${s(it.hero_class)}, ${s(it.starts_at)}, ${s(it.ends_at)}, ${s(it.time_precision) ?? "exact"}, ${s(it.notice_url)}, ${s(it.source_url)})
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, hero = EXCLUDED.hero, artifact = EXCLUDED.artifact,
              element = EXCLUDED.element, hero_class = EXCLUDED.hero_class, starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at,
              time_precision = EXCLUDED.time_precision, notice_url = EXCLUDED.notice_url, source_url = EXCLUDED.source_url, updated_at = now()`;
        } else {
          if (!s(it.id) || !s(it.name)) throw new Error("events need id and name");
          await tx`INSERT INTO events (id, name, kind, description, rewards, starts_at, ends_at, time_precision, source_url)
            VALUES (${s(it.id)}, ${s(it.name)}, ${s(it.kind)}, ${s(it.description)}, ${s(it.rewards)}, ${s(it.starts_at)}, ${s(it.ends_at)}, ${s(it.time_precision) ?? "exact"}, ${s(it.source_url)})
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind, description = EXCLUDED.description, rewards = EXCLUDED.rewards,
              starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at, time_precision = EXCLUDED.time_precision, source_url = EXCLUDED.source_url, updated_at = now()`;
        }
        upserted++;
      }
      if (del.length) {
        if (type === "codes") await tx`DELETE FROM codes WHERE code IN ${tx(del)}`;
        else if (type === "banners") await tx`DELETE FROM banners WHERE id IN ${tx(del)}`;
        else await tx`DELETE FROM events WHERE id IN ${tx(del)}`;
      }
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
  revalidatePath("/", "layout");
  return json({ ok: true, upserted, deleted: del.length });
}
