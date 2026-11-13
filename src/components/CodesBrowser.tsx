"use client";
import { useEffect, useMemo, useState } from "react";
import { CodeRow } from "./CodeRow";
import { logZeroResults } from "./Beacon";
import { inputCls } from "./AjaxForm";
import type { Code } from "@/lib/types";

export function CodesBrowser({ codes }: { codes: Code[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return codes;
    return codes.filter((c) => [c.code, c.rewards, c.source_name].some((v) => v?.toLowerCase().includes(s)));
  }, [q, codes]);
  useEffect(() => {
    if (q.trim() && filtered.length === 0) {
      const t = setTimeout(() => logZeroResults("codes", q), 800);
      return () => clearTimeout(t);
    }
  }, [q, filtered.length]);
  const groups = [
    { key: "active", title: "Working codes", hint: "A source states a future end date." },
    { key: "unconfirmed", title: "Unconfirmed", hint: "Listed as valid by one tracker with no end date. Might work, might not." },
    { key: "expired", title: "Expired", hint: "" },
  ] as const;
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search codes or rewards (e.g. Leif, gold)"
        className={inputCls}
        aria-label="Search codes"
      />
      {filtered.length === 0 && <p className="mt-6 text-zinc-400">No codes match “{q}”.</p>}
      {groups.map((g) => {
        const list = filtered.filter((c) => c.status === g.key);
        if (!list.length) return null;
        return (
          <section key={g.key} className="mt-6">
            <h2 className="text-lg font-bold text-white">
              {g.title} <span className="text-sm font-normal text-zinc-500">({list.length})</span>
            </h2>
            {g.hint && <p className="text-xs text-zinc-500">{g.hint}</p>}
            <ul className="mt-2 space-y-2">
              {list.map((c) => (
                <CodeRow key={c.code} c={c} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
