import type { Metadata } from "next";
import { AjaxForm, inputCls } from "@/components/AjaxForm";
import { Pill } from "@/components/BannerCard";
import { bannerPhase, getBanners, limitedHeroes } from "@/lib/data";
import { cap, daysBetween, elementColor, fmtDateUTC, nowMs } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Rerun Watch: when did each limited hero last run?",
  description: "Every Epic Seven limited hero with their last banner run and days since. Get an email when your hero is back.",
  alternates: { canonical: "/reruns" },
};

export default async function RerunsPage() {
  const banners = await getBanners();
  const now = nowMs();
  const heroes = limitedHeroes(banners);
  const liveHeroes = new Set(banners.filter((b) => b.type === "limited" && bannerPhase(b, now) === "current").map((b) => b.hero));
  return (
    <div>
      <h1 className="text-2xl font-black text-white">Rerun Watch</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {heroes.length} limited heroes, longest wait first. Based on limited drop-rate-up banners in our archive; collab and seasonal heroes included.
      </p>

      <section className="mt-5 rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
        <h2 className="font-bold text-white">Email me when they&apos;re back</h2>
        <p className="text-sm text-zinc-400">One email when your hero gets a new limited banner. Nothing else.</p>
        <AjaxForm action="/api/rerun-alert" submitLabel="Watch this hero" success="Done. We'll email you when they're back." className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="sr-only">Hero</span>
            <select name="hero" required className={inputCls} defaultValue="">
              <option value="" disabled>
                Pick a limited hero
              </option>
              {[...heroes].sort((a, b) => a.hero.localeCompare(b.hero)).map((h) => (
                <option key={h.hero} value={h.hero}>
                  {h.hero}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Email</span>
            <input name="email" type="email" required placeholder="you@email.com" className={inputCls} autoComplete="email" />
          </label>
        </AjaxForm>
      </section>

      <ul className="mt-5 space-y-2">
        {heroes.map((h) => {
          const live = liveHeroes.has(h.hero);
          const since = h.last_end ? daysBetween(h.last_end, now) : null;
          return (
            <li key={h.hero} className="flex items-center gap-3 rounded-xl bg-zinc-900/80 p-3 ring-1 ring-zinc-800">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{h.hero}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                  {h.element && <Pill cls={elementColor[h.element] ?? ""}>{cap(h.element)}</Pill>}
                  {h.hero_class && <span>{cap(h.hero_class)}</span>}
                  <span>
                    · last run {fmtDateUTC(h.last_start)} – {fmtDateUTC(h.last_end)}
                  </span>
                  <span>
                    · {h.runs} run{h.runs > 1 ? "s" : ""}
                  </span>
                  {h.last_notice_url && (
                    <a href={h.last_notice_url} target="_blank" rel="noopener nofollow" className="underline decoration-zinc-600">
                      notice
                    </a>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {live ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">LIVE NOW</span>
                ) : since != null ? (
                  <>
                    <p className="font-mono text-lg font-bold text-white">{since.toLocaleString()}</p>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">days since</p>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
