import type { Metadata } from "next";
import { eventIsLive, getEvents } from "@/lib/data";
import { cap, fmtDateUTC, nowMs } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Epic Seven events: what's live and when it ends",
  description: "Live Epic Seven events, side stories and shop rotations with their end dates.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await getEvents();
  const now = nowMs();
  const live = events.filter((e) => eventIsLive(e, now));
  const other = events.filter((e) => !eventIsLive(e, now));
  const Card = ({ e }: { e: (typeof events)[number] }) => {
    const exact = e.time_precision === "exact";
    return (
      <li className="rounded-xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold text-white">{e.name}</p>
          {e.kind && <span className="text-xs uppercase tracking-wide text-zinc-500">{cap(e.kind)}</span>}
        </div>
        {e.description && <p className="mt-1 text-sm text-zinc-300">{e.description}</p>}
        {e.rewards && <p className="mt-1 text-sm text-zinc-200">🎁 {e.rewards}</p>}
        <p className="mt-2 text-xs text-zinc-400">
          {e.starts_at ? `${fmtDateUTC(e.starts_at, exact)} → ` : ""}
          {e.ends_at ? `ends ${fmtDateUTC(e.ends_at, exact)}` : "end date not stated"}
          {e.source_url && (
            <>
              {" · "}
              <a href={e.source_url} target="_blank" rel="noopener nofollow" className="underline decoration-zinc-600">
                source
              </a>
            </>
          )}
        </p>
      </li>
    );
  };
  return (
    <div>
      <h1 className="text-2xl font-black text-white">Events</h1>
      <p className="mt-1 text-sm text-zinc-400">What&apos;s live now and when it ends (UTC dates).</p>
      <h2 className="mt-5 text-lg font-bold text-white">Live now ({live.length})</h2>
      {live.length ? (
        <ul className="mt-2 space-y-2">
          {live.map((e) => (
            <Card key={e.id} e={e} />
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-zinc-400">No live events on file right now.</p>
      )}
      {other.length > 0 && (
        <>
          <h2 className="mt-6 text-lg font-bold text-white">Ended or not started</h2>
          <ul className="mt-2 space-y-2 opacity-70">
            {other.map((e) => (
              <Card key={e.id} e={e} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
