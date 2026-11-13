"use client";
import { useState, type ReactNode } from "react";

/** Posts form fields as JSON to `action`. Includes a hidden honeypot field named "website". */
export function AjaxForm({
  action,
  children,
  success,
  submitLabel,
  className = "",
  extra,
}: {
  action: string;
  children: ReactNode;
  success: string;
  submitLabel: string;
  className?: string;
  extra?: Record<string, string>;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  if (state === "done") {
    return <p className="rounded-xl bg-emerald-500/10 p-4 text-emerald-300 ring-1 ring-emerald-500/30">{success}</p>;
  }
  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
        try {
          const res = await fetch(action, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, ...extra }),
          });
          const out = await res.json().catch(() => ({}));
          if (res.ok && out.ok !== false) setState("done");
          else {
            setState("error");
            setMsg(out.error || "Something went wrong.");
          }
        } catch {
          setState("error");
          setMsg("Network error. Try again?");
        }
      }}
    >
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {children}
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-3 w-full rounded-xl bg-violet-500 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60 sm:w-auto"
      >
        {state === "sending" ? "Sending…" : submitLabel}
      </button>
      {state === "error" && <p className="mt-2 text-sm text-red-300">{msg}</p>}
    </form>
  );
}

export const inputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none";
