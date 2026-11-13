import type { Metadata } from "next";
import { AjaxForm, inputCls } from "@/components/AjaxForm";
import { getPublicStats } from "@/lib/data";
import { SPONSOR_PRICE } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Sponsor E7 This Week",
  description: "Reach Epic Seven players: one sponsor slot on the site plus the Thursday email, starting at $25/week.",
  alternates: { canonical: "/sponsor" },
};

export default async function SponsorPage() {
  const stats = await getPublicStats();
  const hasStats = stats && (stats.subscribers > 0 || stats.pageviews30d > 0);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-white">Sponsor E7 This Week</h1>
      <p className="mt-1 text-zinc-400">Epic Seven players check this site for codes, banners and reruns. One sponsor at a time, so you&apos;re the only one they see.</p>

      <section className="mt-5 grid grid-cols-2 gap-2">
        {hasStats ? (
          <>
            <div className="rounded-xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
              <p className="font-mono text-2xl font-bold text-white">{stats.subscribers.toLocaleString()}</p>
              <p className="text-xs text-zinc-400">email subscribers</p>
            </div>
            <div className="rounded-xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
              <p className="font-mono text-2xl font-bold text-white">{stats.pageviews30d.toLocaleString()}</p>
              <p className="text-xs text-zinc-400">pageviews, last 30 days</p>
            </div>
          </>
        ) : (
          <div className="col-span-2 rounded-xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
            <p className="font-semibold text-white">New site</p>
            <p className="text-sm text-zinc-400">We just launched, so there are no numbers to show yet. Real subscriber and traffic counts will appear here automatically. Early sponsors get the launch price.</p>
          </div>
        )}
      </section>

      <section className="mt-5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-transparent p-5 ring-1 ring-amber-500/30">
        <h2 className="text-lg font-bold text-white">The offer</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-200">
          <li>One sponsor bar across every page of the site for the week (Thursday to Thursday)</li>
          <li>Your spot in the Thursday email that goes out after maintenance</li>
          <li>Click tracking on your link, shared with you at the end of the week</li>
        </ul>
        <p className="mt-3 text-white">
          Starting at <strong>{SPONSOR_PRICE}</strong> while we&apos;re small.
        </p>
        <p className="mt-1 text-xs text-zinc-400">Good fits: other games, E7 creators, gaming gear, tools players use.</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold text-white">Get in touch</h2>
        <AjaxForm action="/api/sponsor-inquiry" submitLabel="Send" success="Thanks! We'll reply by email soon." className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="name" placeholder="Your name" maxLength={120} className={inputCls} autoComplete="name" />
            <input name="email" type="email" required placeholder="Email *" className={inputCls} autoComplete="email" />
          </div>
          <input name="company" placeholder="Company / channel" maxLength={160} className={inputCls} />
          <textarea name="message" rows={4} maxLength={4000} placeholder="What would you like to promote, and when?" className={inputCls} />
        </AjaxForm>
      </section>
    </div>
  );
}
