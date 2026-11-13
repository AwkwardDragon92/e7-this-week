import { CopyButton } from "./CopyButton";
import { fmtDateUTC } from "@/lib/format";
import type { Code } from "@/lib/types";

const statusStyle = {
  active: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  unconfirmed: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  expired: "bg-zinc-700/40 text-zinc-400 ring-zinc-600/40",
};
const statusLabel = { active: "Working", unconfirmed: "Unconfirmed", expired: "Expired" };

export function CodeRow({ c }: { c: Code }) {
  const dim = c.status === "expired";
  return (
    <li className={`rounded-xl bg-zinc-900/80 p-3 ring-1 ring-zinc-800 ${dim ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        <code className={`min-w-0 flex-1 break-all font-mono text-base font-bold ${dim ? "text-zinc-400 line-through decoration-zinc-600" : "text-white"}`}>{c.code}</code>
        {!dim && <CopyButton text={c.code} />}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
        <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${statusStyle[c.status]}`}>{statusLabel[c.status]}</span>
        {c.rewards && <span className="text-zinc-200">🎁 {c.rewards}</span>}
        {c.found_at && <span>Found {fmtDateUTC(c.found_at)}</span>}
        {c.expires_at ? (
          <span>
            {dim ? "Ended" : "Ends"} {fmtDateUTC(c.expires_at, !c.note?.includes("day only"))}
          </span>
        ) : (
          <span>End date not stated</span>
        )}
        {c.source_url && (
          <a href={c.source_url} target="_blank" rel="noopener nofollow" className="underline decoration-zinc-600 hover:text-zinc-200">
            {c.source_name ?? "source"}
          </a>
        )}
      </div>
    </li>
  );
}
