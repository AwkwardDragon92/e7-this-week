"use client";
import { useEffect, useMemo, useState } from "react";
import { BannerCard } from "./BannerCard";
import { logZeroResults } from "./Beacon";
import { inputCls } from "./AjaxForm";
import { cap } from "@/lib/format";
import type { Banner } from "@/lib/types";

type Phase = "current" | "upcoming" | "past";
type B = Banner & { phase: Phase };

const PAGE = 40;

export function BannersBrowser({ banners, elements, types }: { banners: B[]; elements: string[]; types: string[] }) {
  const [q, setQ] = useState("");
  const [el, setEl] = useState("");
  const [ty, setTy] = useState("");
  const [shown, setShown] = useState(PAGE);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return banners.filter(
      (b) =>
        (!el || b.element === el) &&
        (!ty || b.type === ty) &&
        (!s || [b.hero, b.title, b.artifact, b.hero_class].some((v) => v?.toLowerCase().includes(s))),
    );
  }, [banners, q, el, ty]);
  useEffect(() => {
    if (q.trim() && filtered.length === 0) {
      const t = setTimeout(() => logZeroResults("banners", q), 800);
      return () => clearTimeout(t);
    }
  }, [q, filtered.length]);
  const sel = "rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white";
  const sections: { key: Phase; title: string }[] = [
    { key: "current", title: "Running now" },
    { key: "upcoming", title: "Upcoming" },
    { key: "past", title: "Past banners" },
  ];
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search hero or artifact" className={inputCls} aria-label="Search banners" />
        <select value={el} onChange={(e) => { setEl(e.target.value); setShown(PAGE); }} className={sel} aria-label="Element">
          <option value="">All elements</option>
          {elements.map((x) => (
            <option key={x} value={x}>
              {cap(x)}
            </option>
          ))}
        </select>
        <select value={ty} onChange={(e) => { setTy(e.target.value); setShown(PAGE); }} className={sel} aria-label="Banner type">
          <option value="">All types</option>
          {types.map((x) => (
            <option key={x} value={x}>
              {cap(x)}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{filtered.length} banners</p>
      {filtered.length === 0 && <p className="mt-6 text-zinc-400">Nothing matches. Try another hero name or clear the filters.</p>}
      {sections.map((s) => {
        let list = filtered.filter((b) => b.phase === s.key);
        if (!list.length) {
          if (s.key === "upcoming" && !q && !el && !ty)
            return (
              <section key={s.key} className="mt-6">
                <h2 className="text-lg font-bold text-white">Upcoming</h2>
                <p className="mt-1 text-sm text-zinc-400">Nothing announced yet. Smilegate usually posts the next few weeks in the Thursday update notice.</p>
              </section>
            );
          return null;
        }
        const total = list.length;
        if (s.key === "past") list = list.slice(0, shown);
        return (
          <section key={s.key} className="mt-6">
            <h2 className="text-lg font-bold text-white">
              {s.title} <span className="text-sm font-normal text-zinc-500">({total})</span>
            </h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((b) => (
                <BannerCard key={b.id} b={b} />
              ))}
            </ul>
            {s.key === "past" && total > shown && (
              <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="mt-3 w-full rounded-xl bg-zinc-800 py-2.5 font-semibold text-zinc-200 hover:bg-zinc-700">
                Show more ({total - shown} left)
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
