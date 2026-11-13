const DAY = 86400000;

export function fmtDateUTC(iso: string | null, withTime = false) {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
  if (!withTime) return date;
  const t = d.toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });
  return `${date}, ${t} UTC`;
}

export function daysBetween(fromIso: string, to = Date.now()) {
  return Math.floor((to - new Date(fromIso).getTime()) / DAY);
}

export const ELEMENTS = ["fire", "ice", "earth", "light", "dark"] as const;
export const BANNER_TYPES = ["limited", "pickup", "class", "group", "mystic"] as const;

export function cap(s: string | null | undefined) {
  if (!s) return "";
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const elementColor: Record<string, string> = {
  fire: "text-red-300 bg-red-500/10 ring-red-500/30",
  ice: "text-sky-300 bg-sky-500/10 ring-sky-500/30",
  earth: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/30",
  light: "text-amber-200 bg-amber-400/10 ring-amber-400/30",
  dark: "text-fuchsia-300 bg-fuchsia-500/10 ring-fuchsia-500/30",
};

/** Request/render time. Pages revalidate every 5 minutes, so this is "now" within that window. */
export function nowMs() {
  return Date.now();
}
