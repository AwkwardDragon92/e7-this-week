import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Accepts JSON or form-encoded bodies. */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") || "";
  try {
    if (type.includes("application/json")) return (await req.json()) as Record<string, unknown>;
    const fd = await req.formData();
    return Object.fromEntries(fd.entries());
  } catch {
    return {};
  }
}

export function str(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

export function ipHash(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  if (!ip) return null;
  return createHash("sha256").update(ip + (process.env.ADMIN_TOKEN || "e7")).digest("hex").slice(0, 32);
}

export function isAdmin(req: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || token.length < 16) return false;
  const got = req.headers.get("authorization") || "";
  const want = `Bearer ${token}`;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const unauthorized = () => json({ error: "unauthorized" }, 401);
export const noDb = () => json({ error: "database not configured (set DATABASE_URL)" }, 503);

export function isHttpUrl(s: string | null) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
