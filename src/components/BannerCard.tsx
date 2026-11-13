import { cap, elementColor, fmtDateUTC } from "@/lib/format";
import type { Banner } from "@/lib/types";

const typeStyle: Record<string, string> = {
  limited: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  pickup: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  class: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  group: "bg-teal-500/15 text-teal-300 ring-teal-500/30",
  mystic: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
};

export function Pill({ children, cls }: { children: React.ReactNode; cls: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cls}`}>{children}</span>;
}

export function BannerCard({ b }: { b: Banner }) {
  const exact = b.time_precision === "exact";
  return (
    <li className="rounded-xl bg-zinc-900/80 p-3 ring-1 ring-zinc-800">
      <div className="flex flex-wrap items-center gap-1.5">
        <Pill cls={typeStyle[b.type] ?? typeStyle.pickup}>{cap(b.type)}</Pill>
        {b.element && <Pill cls={elementColor[b.element] ?? ""}>{cap(b.element)}</Pill>}
        {b.hero_class && <span className="text-xs text-zinc-400">{cap(b.hero_class)}</span>}
      </div>
      <p className="mt-1.5 font-semibold text-white">{b.hero ?? b.title}</p>
      {b.artifact && <p className="text-sm text-zinc-400">✦ {b.artifact}</p>}
      <p className="mt-1 text-xs text-zinc-400">
        {fmtDateUTC(b.starts_at, exact)} → {b.ends_at ? fmtDateUTC(b.ends_at, exact) : "?"}
      </p>
      <p className="mt-1 text-xs">
        {b.notice_url && (
          <a href={b.notice_url} target="_blank" rel="noopener nofollow" className="text-zinc-400 underline decoration-zinc-600 hover:text-zinc-200">
            Official notice
          </a>
        )}
        {b.notice_url && b.source_url && <span className="text-zinc-600"> · </span>}
        {b.source_url && (
          <a href={b.source_url} target="_blank" rel="noopener nofollow" className="text-zinc-500 underline decoration-zinc-700 hover:text-zinc-300">
            source
          </a>
        )}
      </p>
    </li>
  );
}
