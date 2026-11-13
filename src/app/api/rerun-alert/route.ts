import { getSql, logError } from "@/lib/db";
import { getBanners, limitedHeroes } from "@/lib/data";
import { checkEmail } from "@/lib/email";
import { json, readBody, str } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readBody(req);
  if (str(body.website)) return json({ ok: true });
  const check = checkEmail(body.email);
  if (!check.ok) return json({ ok: false, error: check.error }, 400);
  const hero = str(body.hero, 120);
  if (!hero) return json({ ok: false, error: "Pick a hero." }, 400);
  const heroes = limitedHeroes(await getBanners()).map((h) => h.hero);
  if (!heroes.includes(hero)) return json({ ok: false, error: "Unknown limited hero." }, 400);
  const sql = getSql();
  if (!sql) return json({ ok: false, error: "Alerts open soon. Check back in a bit!" }, 503);
  try {
    await sql`INSERT INTO rerun_alerts (email, hero) VALUES (${check.email}, ${hero}) ON CONFLICT (email, hero) DO NOTHING`;
    return json({ ok: true });
  } catch (e) {
    await logError("api.rerun-alert", e, "/api/rerun-alert");
    return json({ ok: false, error: "Something went wrong. Try again?" }, 500);
  }
}
