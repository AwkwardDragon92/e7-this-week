"use client";
import { useState } from "react";
import { useLocalStorageFlag } from "./hooks";

export function SponsorBar({ weekId, slug, name, message, cta }: { weekId: number; slug: string; name: string; message: string; cta: string | null }) {
  const key = `e7-sponsor-closed-${weekId}`;
  const stored = useLocalStorageFlag(key);
  const [closed, setClosed] = useState(false);
  if (stored || closed) return null;
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 text-sm text-amber-100">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Sponsor</span>
        <a href={`/go/${slug}`} rel="sponsored noopener" target="_blank" className="flex-1 truncate hover:underline">
          <strong>{name}</strong> · {message} {cta && <span className="font-semibold underline">{cta} →</span>}
        </a>
        <button
          type="button"
          aria-label="Close sponsor message"
          className="rounded px-2 text-lg leading-none text-amber-200/70 hover:text-white"
          onClick={() => {
            localStorage.setItem(key, "1");
            setClosed(true);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
