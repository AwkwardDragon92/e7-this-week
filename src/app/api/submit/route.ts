import { getSql, logError } from "@/lib/db";
import { ipHash, isHttpUrl, json, readBody, str } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readBody(req);
  if (str(body.website)) return json({ ok: true });
  const code = str(body.code, 64)?.replace(/\s+/g, "");
  if (!code || !/^[A-Za-z0-9_\-]{3,64}$/.test(code)) return json({ ok: false, error: "Codes are letters, numbers and underscores." }, 400);
  const rewards = str(body.rewards, 300);
  const source = str(body.source_url, 500);
  if (source && !isHttpUrl(source)) return json({ ok: false, error: "Source link must start with https://" }, 400);
  const sql = getSql();
  if (!sql) return json({ ok: false, error: "Submissions open soon. Check back in a bit!" }, 503);
  try {
    const hash = ipHash(req);
    if (hash) {
      const [r] = await sql`SELECT count(*)::int AS n FROM submissions WHERE ip_hash = ${hash} AND created_at > now() - interval '1 hour'`;
      if (r.n >= 10) return json({ ok: false, error: "Too many submissions. Try again later." }, 429);
    }
    await sql`INSERT INTO submissions (code, rewards, source_url, ip_hash) VALUES (${code}, ${rewards}, ${source}, ${hash})`;
    return json({ ok: true });
  } catch (e) {
    await logError("api.submit", e, "/api/submit");
    return json({ ok: false, error: "Something went wrong. Try again?" }, 500);
  }
}
