import { logError } from "@/lib/db";
import { readBody, str } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readBody(req);
  const message = str(body.message, 2000);
  if (message) {
    const err = new Error(message);
    err.stack = str(body.stack, 8000) ?? undefined;
    await logError("client", err, str(body.path, 300) ?? undefined);
  }
  return new Response(null, { status: 204 });
}
