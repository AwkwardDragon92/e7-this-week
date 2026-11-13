import Link from "next/link";
import { CodeRow } from "@/components/CodeRow";
import { Countdown, UtcLocal } from "@/components/Countdown";
import { SignupBox } from "@/components/SignupBox";
import { BannerCard, Pill } from "@/components/BannerCard";
import { bannerPhase, eventIsLive, getBanners, getCodes, getEvents } from "@/lib/data";
import { cap, elementColor, fmtDateUTC, nowMs } from "@/lib/format";
import { REDEEM_URL } from "@/lib/site";

export const revalidate = 300;

export default async function Home() {
  const [codes, banners, events] = await Promise.all([getCodes(), getBanners(), getEvents()]);
  const now = nowMs();
  const working = codes.filter((c) => c.status === "active");
  const unconfirmed = codes.filter((c) => c.status === "unconfirmed");
  const current = banners.filter((b) => bannerPhase(b, now) === "current").sort((a, b) => (a.ends_at ?? "").localeCompare(b.ends_at ?? ""));
  const featured = current.find((b) => b.type !== "mystic" && b.time_precision === "exact") ?? current[0];
  const otherCurrent = current.filter((b) => b !== featured);
  const upcoming = banners.filter((b) => bannerPhase(b, now) === "upcoming").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const liveEvents = events.filter((e) => eventIsLive(e, now));
  const endingSoon = [...current.filter((b) => b.ends_at), ...liveEvents.filter((e) => e.ends_at)]
    .map((x) => ({ name: "hero" in x ? `${x.hero ?? x.title} banner` : x.name, ends: x.ends_at!, exact: x.time_precision === "exact" }))
    .sort((a, b) => a.ends.localeCompare(b.ends))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">This week in Epic Seven</h1>
        <p className="mt-1 text-sm text-zinc-400">Working codes, the live banner, and what&apos;s next. Times in UTC with your local time alongside.</p>
      </section>

      <section aria-labelledby="codes-h">
        <div className="flex items-end justify-between gap-3">
          <h2 id="codes-h" className="text-lg font-bold text-white">
            Working codes <span className="text-sm font-normal text-zinc-500">({working.length})</span>
          </h2>
          <a href={REDEEM_URL} target="_blank" rel="noopener" className="shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700">
            Redeem on STOVE ↗
          </a>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Copy a code, open the official coupon page, log in, and pick your server. Rewards land in your mailbox.</p>
        {working.length ? (
          <ul className="mt-3 space-y-2">
            {working.map((c) => (
              <CodeRow key={c.code} c={c} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl bg-zinc-900 p-4 text-zinc-400 ring-1 ring-zinc-800">No confirmed working codes right now.</p>
        )}
        <p className="mt-2 text-sm">
          <Link href="/codes" className="text-violet-300 hover:underline">
            All codes{unconfirmed.length ? `, plus ${unconfirmed.length} unconfirmed` : ""} →
          </Link>
        </p>
      </section>

      {featured && (
        <section aria-labelledby="banner-h" className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800 sm:p-5">
          <h2 id="banner-h" className="text-xs font-bold uppercase tracking-wider text-violet-300">
            Current banner
          </h2>
          <p className="mt-1 text-xl font-black text-white">{featured.hero ?? featured.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pill cls="bg-violet-500/15 text-violet-300 ring-violet-500/30">{cap(featured.type)}</Pill>
            {featured.element && <Pill cls={elementColor[featured.element] ?? ""}>{cap(featured.element)}</Pill>}
            {featured.hero_class && <span className="text-xs text-zinc-400">{cap(featured.hero_class)}</span>}
            {featured.artifact && <span className="text-xs text-zinc-400">· ✦ {featured.artifact}</span>}
          </div>
          {featured.ends_at && (
            <div className="mt-3 rounded-xl bg-black/40 p-3">
              <Countdown to={featured.ends_at} />
              <p className="mt-1 text-xs text-zinc-400">
                Ends <UtcLocal iso={featured.ends_at} dateOnly={featured.time_precision === "date"} />
              </p>
              <p className="text-xs text-zinc-500">
                Started <UtcLocal iso={featured.starts_at} dateOnly={featured.time_precision === "date"} />
              </p>
            </div>
          )}
          {featured.notice_url && (
            <a href={featured.notice_url} target="_blank" rel="noopener nofollow" className="mt-2 inline-block text-xs text-zinc-400 underline decoration-zinc-600">
              Official notice ↗
            </a>
          )}
          {otherCurrent.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-zinc-300">Also running</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {otherCurrent.map((b) => (
                  <BannerCard key={b.id} b={b} />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="next-h">
        <h2 id="next-h" className="text-lg font-bold text-white">
          What&apos;s next
        </h2>
        {upcoming.length ? (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {upcoming.slice(0, 4).map((b) => (
              <BannerCard key={b.id} b={b} />
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-zinc-400">
            No new banner announced yet. New banners usually start Thursdays after maintenance (Wednesday evening in the Americas).
          </p>
        )}
        {endingSoon.length > 0 && (
          <ul className="mt-3 divide-y divide-zinc-800 rounded-xl bg-zinc-900/60 ring-1 ring-zinc-800">
            {endingSoon.map((x) => (
              <li key={x.name} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-zinc-200">{x.name}</span>
                <span className="shrink-0 text-xs text-zinc-400">ends {fmtDateUTC(x.ends, x.exact)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm">
          <Link href="/events" className="text-violet-300 hover:underline">
            Live events →
          </Link>
          <span className="text-zinc-600"> · </span>
          <Link href="/reruns" className="text-violet-300 hover:underline">
            Rerun Watch →
          </Link>
        </p>
      </section>

      <SignupBox />
    </div>
  );
}
