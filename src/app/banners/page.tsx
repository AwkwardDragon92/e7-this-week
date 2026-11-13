import type { Metadata } from "next";
import { BannersBrowser } from "@/components/BannersBrowser";
import { bannerPhase, getBanners } from "@/lib/data";
import { BANNER_TYPES, nowMs } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Epic Seven banner history and schedule",
  description: "Current, upcoming and past Epic Seven banners. Filter by hero, element and type: limited, pickup, class, group and mystic.",
  alternates: { canonical: "/banners" },
};

export default async function BannersPage() {
  const banners = await getBanners();
  const now = nowMs();
  // Most rows share one archive source; send it once to keep the page light.
  const mainSource = "https://bannerhistory.app/en/e7-pickup-history";
  const withPhase = banners.map((b) => ({ ...b, source_url: b.source_url === mainSource ? null : b.source_url, phase: bannerPhase(b, now) }));
  const elements = [...new Set(banners.map((b) => b.element).filter(Boolean) as string[])].sort();
  const types = BANNER_TYPES.filter((t) => banners.some((b) => b.type === t));
  const oldest = banners.at(-1)?.starts_at.slice(0, 4);
  return (
    <div>
      <h1 className="text-2xl font-black text-white">Banners</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {banners.length} banners{oldest ? ` since ${oldest}` : ""}, each linked to its official notice where available. Times in UTC. Archive compiled from{" "}
        <a href="https://bannerhistory.app/en/e7-pickup-history" target="_blank" rel="noopener nofollow" className="underline decoration-zinc-600">
          BannerHistory
        </a>
        .
      </p>
      <div className="mt-4">
        <BannersBrowser banners={withPhase} elements={elements} types={[...types]} />
      </div>
    </div>
  );
}
