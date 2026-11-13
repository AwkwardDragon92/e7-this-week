import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Beacon } from "@/components/Beacon";
import { SponsorBar } from "@/components/SponsorBar";
import { getActiveSponsor } from "@/lib/data";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: Epic Seven codes, banners & rerun tracker`, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, url: SITE_URL },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#09090b", width: "device-width", initialScale: 1 };

const nav = [
  { href: "/codes", label: "Codes" },
  { href: "/banners", label: "Banners" },
  { href: "/reruns", label: "Reruns" },
  { href: "/events", label: "Events" },
  { href: "/submit", label: "Submit" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sponsor = await getActiveSponsor();
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {sponsor && <SponsorBar weekId={sponsor.week_id} slug={sponsor.slug} name={sponsor.name} message={sponsor.message} cta={sponsor.cta} />}
        <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:flex-nowrap sm:py-3">
            <Link href="/" className="shrink-0 font-black tracking-tight text-white">
              E7 <span className="text-violet-400">This Week</span>
            </Link>
            <nav className="grid w-full grid-cols-5 text-sm sm:flex sm:w-auto sm:flex-1 sm:gap-1">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-lg px-1 py-1.5 text-center text-zinc-300 hover:bg-zinc-800 hover:text-white sm:px-2.5">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-16 pt-5">{children}</main>
        <footer className="border-t border-zinc-800 py-8 text-sm text-zinc-500">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 sm:flex-row sm:justify-between">
            <p>
              E7 This Week is a fan site. Not affiliated with or endorsed by Smilegate. Epic Seven and related names and art are trademarks of Smilegate.
            </p>
            <p className="flex shrink-0 gap-4">
              <Link href="/sponsor" className="hover:text-zinc-300">
                Sponsor
              </Link>
              <Link href="/submit" className="hover:text-zinc-300">
                Submit a code
              </Link>
            </p>
          </div>
        </footer>
        <Beacon />
      </body>
    </html>
  );
}
