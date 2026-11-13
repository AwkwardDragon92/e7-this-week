"use client";
import { useMounted, useNow } from "./hooks";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown to `to`. Server renders a static "ends …" line; the client fills in the ticking value. */
export function Countdown({ to, label = "Ends in" }: { to: string; label?: string }) {
  const now = useNow();
  const target = new Date(to).getTime();
  const p = now == null ? null : parts(target - now);
  return (
    <div className="font-mono tabular-nums" suppressHydrationWarning>
      <span className="text-xs uppercase tracking-wide text-zinc-400">{label} </span>
      {p == null ? (
        <span className="text-zinc-300">…</span>
      ) : target - (now ?? 0) <= 0 ? (
        <span className="text-zinc-300">ended</span>
      ) : (
        <span className="text-lg font-bold text-white">
          {p.d}d {String(p.h).padStart(2, "0")}h {String(p.m).padStart(2, "0")}m {String(p.s).padStart(2, "0")}s
        </span>
      )}
    </div>
  );
}

/** Shows an instant in UTC (server-rendered) plus the viewer's local time (client). */
export function UtcLocal({ iso, dateOnly = false }: { iso: string; dateOnly?: boolean }) {
  const mounted = useMounted();
  const local =
    mounted && !dateOnly
      ? new Date(iso).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : null;
  const d = new Date(iso);
  const utc = dateOnly
    ? d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })
    : `${d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })} UTC`;
  return (
    <span suppressHydrationWarning>
      {utc}
      {local && <span className="text-zinc-400"> · your time: {local}</span>}
    </span>
  );
}
