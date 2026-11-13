import { getSql } from "@/lib/db";
import { readBody, str } from "@/lib/http";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly/i;

export async function POST(req: Request) {
  const sql = getSql();
  if (!sql || BOT.test(req.headers.get("user-agent") || "")) return new Response(null, { status: 204 });
  const body = await readBody(req);
  const path = str(body.path, 300);
  if (!path || !path.startsWith("/")) return new Response(null, { status: 204 });
  let ref = str(body.ref, 300);
  try {
    if (ref) ref = new URL(ref).hostname;
  } catch {
    ref = null;
  }
  try {
    await sql`INSERT INTO pageviews (path, referrer) VALUES (${path}, ${ref})`;
  } catch {
    /* ignore */
  }
  return new Response(null, { status: 204 });
}
