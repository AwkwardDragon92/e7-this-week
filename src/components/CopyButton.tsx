"use client";
import { useState } from "react";

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${done ? "bg-emerald-500 text-black" : "bg-violet-500 text-white hover:bg-violet-400"} ${className}`}
      aria-label={`Copy code ${text}`}
    >
      {done ? "Copied!" : "Copy"}
    </button>
  );
}
