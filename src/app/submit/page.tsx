import type { Metadata } from "next";
import { AjaxForm, inputCls } from "@/components/AjaxForm";

export const metadata: Metadata = {
  title: "Submit an Epic Seven code",
  description: "Spotted a new Epic Seven coupon code? Send it in. Every code is checked before it goes live.",
  alternates: { canonical: "/submit" },
};

export default function SubmitPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-white">Submit a code</h1>
      <p className="mt-1 text-sm text-zinc-400">Found a code on stream, X, Discord or in a notice? Send it in. We check every code before it goes live.</p>
      <AjaxForm action="/api/submit" submitLabel="Send code" success="Thanks! It's in the queue and we'll check it soon." className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-zinc-200">Code *</span>
          <input name="code" required maxLength={64} placeholder="e.g. TY_E8_INFINITY" className={`${inputCls} font-mono`} autoCapitalize="off" autoComplete="off" spellCheck={false} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-zinc-200">Rewards (if you know them)</span>
          <input name="rewards" maxLength={300} placeholder="e.g. 3 Leif, 500k Gold" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-zinc-200">Source link</span>
          <input name="source_url" type="url" maxLength={500} placeholder="https://…" className={inputCls} />
        </label>
      </AjaxForm>
    </div>
  );
}
