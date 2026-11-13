import { getSql } from "@/lib/db";
import { readBody, str } from "@/lib/http";

export async function POST(req: Request) {
  const sql = getSql();
  const body = await readBody(req);
  const page = str(body.page, 40);
  const query = str(body.query, 120);
  if (sql && page && query && query.length >= 2) {
    try {
      await sql`INSERT INTO zero_result_searches (page, query) VALUES (${page}, ${query.toLowerCase()})`;
    } catch {
      /* ignore */
    }
  }
  return new Response(null, { status: 204 });
}
