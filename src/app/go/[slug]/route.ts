import { NextResponse } from "next/server";
import { getSql, logError } from "@/lib/db";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const sql = getSql();
  if (sql) {
    try {
      const [s] = await sql`SELECT id, url FROM sponsors WHERE slug = ${slug}`;
      if (s) {
        await sql`INSERT INTO sponsor_clicks (sponsor_id, slug, referer) VALUES (${s.id}, ${slug}, ${req.headers.get("referer")?.slice(0, 300) ?? null})`;
        return NextResponse.redirect(s.url, 302);
      }
    } catch (e) {
      await logError("go", e, `/go/${slug}`);
    }
  }
  return NextResponse.redirect(new URL("/", req.url), 302);
}
