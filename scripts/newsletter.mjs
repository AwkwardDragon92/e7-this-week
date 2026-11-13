// Builds this week's "E7 This Week" newsletter and (optionally) saves it as a DRAFT Resend broadcast.
// It never sends. Sending is a separate, manual step in Resend (or send-broadcast) after a human review.
//
//   npm run newsletter:preview              -> writes newsletter-preview.html (+ .txt) only
//   npm run newsletter:draft                -> creates/updates this week's draft broadcast in Resend
//
// Flags: --preview <file.html>  --draft  --local (use data/*.json instead of the live DB)  --date YYYY-MM-DD (issue Thursday)
// Env:   NEXT_PUBLIC_SITE_URL, ADMIN_TOKEN (reads live DB data via /api/admin/newsletter-data),
//        RESEND_API_KEY (full access), RESEND_SEGMENT_ID, RESEND_FROM
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://epic7.awkwarddragon.com").replace(/\/$/, "");
const SITE_HOST = SITE.replace(/^https?:\/\//, "");
const REDEEM_URL = "https://epic7.onstove.com/en/coupon";
const DAY = 86400000;

// ---------- issue date: the upcoming Thursday, after maintenance (12:00 UTC) ----------
function issueTime() {
  const d = opt("--date");
  if (d) return new Date(`${d}T12:00:00Z`);
  const now = new Date();
  const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  let add = (4 - t.getUTCDay() + 7) % 7;
  if (add === 0 && now > t) add = 7;
  return new Date(t.getTime() + add * DAY);
}
const ISSUE = issueTime();
const REF = ISSUE.getTime();

// ---------- data ----------
async function loadData() {
  if (!flag("--local") && process.env.ADMIN_TOKEN) {
    const res = await fetch(`${SITE}/api/admin/newsletter-data`, { headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` } });
    if (!res.ok) throw new Error(`newsletter-data ${res.status}`);
    return res.json();
  }
  if (!flag("--local")) console.warn("No ADMIN_TOKEN; using bundled data/*.json (pass --local to silence).");
  const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), "utf8"));
  return { source: "json", codes: load("codes"), banners: load("banners"), events: load("events"), sponsors: [], rerunDemand: [] };
}

const endMs = (x) => {
  if (!x.ends_at) return Infinity;
  let e = new Date(x.ends_at).getTime();
  if (x.time_precision === "date") e += DAY - 1;
  return e;
};
const startMs = (x) => (x.starts_at ? new Date(x.starts_at).getTime() : -Infinity);
const daysFrom = (ms) => Math.round((ms - REF) / DAY);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function fmt(iso, precision = "exact") {
  const d = new Date(iso);
  const base = `${WD[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
  if (precision === "date") return base;
  return `${base}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}
const inDays = (n) => (n <= 0 ? "today" : n === 1 ? "in 1 day" : `in ${n} days`);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");

function buildIssue(data) {
  // 1. Working codes
  const codes = data.codes
    .filter((c) => c.status === "active" && endMs(c) > REF)
    .sort((a, b) => endMs(a) - endMs(b))
    .slice(0, 6)
    .map((c) => ({ ...c, endsSoon: c.expires_at && daysFrom(endMs(c)) <= 10 }));

  // 2/3. Banners (hero banners only: limited, pickup, mystic)
  const heroBanners = data.banners.filter((b) => ["limited", "pickup", "mystic"].includes(b.type));
  const current = heroBanners.filter((b) => startMs(b) <= REF && endMs(b) >= REF).sort((a, b) => endMs(a) - endMs(b));
  const next = heroBanners.filter((b) => startMs(b) > REF).sort((a, b) => startMs(a) - startMs(b));
  const nextStart = next[0] ? startMs(next[0]) : null;
  const nextGroup = nextStart ? next.filter((b) => startMs(b) === nextStart) : [];

  // 4. Rerun watch: limited heroes waiting longest (not live, not announced)
  const live = new Set([...current, ...next].filter((b) => b.type === "limited").map((b) => b.hero));
  const last = new Map();
  for (const b of data.banners) {
    if (b.type !== "limited" || !b.hero) continue;
    const prev = last.get(b.hero);
    if (!prev || b.starts_at > prev.starts_at) last.set(b.hero, b);
  }
  const waiting = [...last.values()]
    .filter((b) => !live.has(b.hero) && b.ends_at)
    .map((b) => ({ hero: b.hero, element: b.element, days: Math.floor((REF - endMs(b)) / DAY) }))
    .sort((a, b) => b.days - a.days);
  const reruns = waiting.slice(0, 3);
  const mostWatched = (data.rerunDemand || []).filter((d) => !live.has(d.hero)).slice(0, 3);
  const backNow = [...live];

  // 5. Events live at send time or starting within 14 days
  const events = data.events
    .filter((e) => endMs(e) >= REF && startMs(e) <= REF + 14 * DAY)
    .sort((a, b) => endMs(a) - endMs(b))
    .slice(0, 5);

  // Sponsor covering the send moment
  const sponsor = (data.sponsors || []).find((s) => new Date(s.starts_at).getTime() <= REF && new Date(s.ends_at).getTime() > REF) || null;

  const issueLabel = `${MON[ISSUE.getUTCMonth()]} ${ISSUE.getUTCDate()}, ${ISSUE.getUTCFullYear()}`;
  const newest = [...current].sort((a, b) => startMs(b) - startMs(a));
  const lead = newest.find((b) => b.type === "limited") || newest[0];
  const subjectBits = [];
  if (codes.length) subjectBits.push(`${codes.length} working code${codes.length > 1 ? "s" : ""}`);
  if (lead?.hero) subjectBits.push(`${lead.hero} banner`);
  else if (nextGroup[0]?.hero) subjectBits.push(`${nextGroup[0].hero} next`);
  const subject = `E7 This Week: ${subjectBits.join(", ") || "codes, banners and events"} (${MON[ISSUE.getUTCMonth()]} ${ISSUE.getUTCDate()})`;
  const preview = codes.length ? `Codes: ${codes.map((c) => c.code).slice(0, 3).join(", ")}${codes.length > 3 ? "…" : ""}` : "This week's banners, reruns and events.";

  return { issueLabel, isoDate: ISSUE.toISOString().slice(0, 10), subject, preview, codes, current, nextGroup, reruns, mostWatched, backNow, events, sponsor };
}

// ---------- rendering ----------
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const C = { bg: "#f4f2fb", card: "#ffffff", ink: "#18181b", mute: "#6b7280", line: "#e7e5f0", accent: "#7c3aed", accentSoft: "#ede9fe", warn: "#b45309" };
const a = (href, text, extra = "") => `<a href="${esc(href)}" style="color:${C.accent};text-decoration:underline;${extra}">${esc(text)}</a>`;
const section = (n, title, inner, more) => `
<tr><td style="padding:20px 24px 4px">
  <p style="margin:0;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.accent};font-weight:700">Pick ${n}</p>
  <h2 style="margin:2px 0 10px;font-size:19px;line-height:1.3;color:${C.ink}">${esc(title)}</h2>
  ${inner}
  ${more ? `<p style="margin:10px 0 0;font-size:13px">${more}</p>` : ""}
</td></tr>
<tr><td style="padding:12px 24px 0"><div style="border-top:1px solid ${C.line}"></div></td></tr>`;
const p = (html, style = "") => `<p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:${C.ink};${style}">${html}</p>`;
const small = (html) => `<span style="font-size:13px;color:${C.mute}">${html}</span>`;

function renderHtml(I) {
  const codesHtml = I.codes.length
    ? I.codes
        .map(
          (c) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;background:${C.accentSoft};border-radius:8px"><tr><td style="padding:10px 12px">
  <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:17px;font-weight:700;color:${C.ink};letter-spacing:.5px">${esc(c.code)}</div>
  <div style="font-size:13px;color:${C.mute};margin-top:2px">${c.rewards ? esc(c.rewards) + " · " : ""}${c.expires_at ? `${c.endsSoon ? `<b style="color:${C.warn}">` : ""}ends ${esc(fmt(c.expires_at, "date"))}${c.endsSoon ? "</b>" : ""}` : "no end date listed"}</div>
</td></tr></table>`,
        )
        .join("")
    : p("No confirmed working codes this week. We'll post the moment one drops.");
  const bannerLine = (b, phase) =>
    p(
      `<b>${esc(b.hero || b.title)}</b>${b.artifact ? ` + ${esc(b.artifact)}` : ""} ${small(`(${esc(cap(b.type))}${b.element ? ", " + esc(cap(b.element)) : ""})`)}<br>` +
        small(
          phase === "current"
            ? b.ends_at
              ? `Ends ${esc(fmt(b.ends_at, b.time_precision))}, ${inDays(daysFrom(endMs(b)))} from this email`
              : "No end date announced"
            : `Starts ${esc(fmt(b.starts_at, b.time_precision))}, ${inDays(daysFrom(startMs(b)))}`,
        ),
    );
  const currentHtml = I.current.length ? I.current.map((b) => bannerLine(b, "current")).join("") : p("Nothing confirmed on the hero banner right now.");
  const nextHtml = I.nextGroup.length
    ? I.nextGroup.map((b) => bannerLine(b, "next")).join("") + p(small("Times are UTC. The site shows a live countdown in your local time."))
    : p("Next banner isn't announced yet. Usually it shows up in the Wednesday maintenance notice.");
  const rerunHtml =
    (I.backNow.length ? p(`Back now or announced: <b>${I.backNow.map(esc).join(", ")}</b>`) : "") +
    (I.reruns.length ? p("Longest waits:") + `<ul style="margin:0 0 8px;padding-left:20px;color:${C.ink};font-size:15px;line-height:1.6">${I.reruns.map((r) => `<li><b>${esc(r.hero)}</b> ${small(`${r.days} days since last run`)}</li>`).join("")}</ul>` : "") +
    (I.mostWatched.length ? p(`Most watched by readers: ${I.mostWatched.map((m) => `<b>${esc(m.hero)}</b> ${small(`(${m.watchers})`)}`).join(", ")}`) : "");
  const eventsHtml = I.events.length
    ? `<ul style="margin:0 0 8px;padding-left:20px;color:${C.ink};font-size:15px;line-height:1.5">${I.events
        .map((e) => `<li style="margin-bottom:6px"><b>${esc(e.name)}</b>${e.rewards ? ` ${small("· " + esc(e.rewards))}` : ""}<br>${small(e.ends_at ? `Ends ${esc(fmt(e.ends_at, e.time_precision))}` : "Ongoing")}</li>`)
        .join("")}</ul>`
    : p("No tracked events this week.");
  const sponsorHtml = I.sponsor
    ? `Sponsored by <b>${esc(I.sponsor.name)}</b>: ${esc(I.sponsor.message)} ${a(`${SITE}/go/${I.sponsor.slug}`, I.sponsor.cta || "Check it out")}`
    : `Sponsored by: <b>Your game/creator here</b> — ${a(`${SITE}/sponsor`, `${SITE_HOST}/sponsor`)}`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(I.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(I.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border-radius:14px;overflow:hidden">
<tr><td style="padding:22px 24px 6px;background:#18181b">
  <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff">E7 <span style="color:#a78bfa">This Week</span></p>
  <p style="margin:4px 0 0;font-size:13px;color:#a1a1aa">Epic Seven codes, banners, reruns and events · ${esc(I.issueLabel)}</p>
</td></tr>
<tr><td style="padding:10px 24px;background:#18181b"><p style="margin:0 0 6px;font-size:13px;color:#d4d4d8">${sponsorHtml.replace(/color:#7c3aed/g, "color:#c4b5fd")}</p></td></tr>
${section(1, "Working codes", codesHtml, `${a(REDEEM_URL, "Redeem on STOVE")} · ${a(`${SITE}/codes`, "All codes")}`)}
${section(2, "On the banner now", currentHtml, a(`${SITE}/banners`, "Banner history"))}
${section(3, "Next banner", nextHtml, a(SITE, "Live countdown"))}
${section(4, "Rerun watch", rerunHtml || p("No rerun data this week."), `${a(`${SITE}/reruns`, "Get an email when your hero is back")}`)}
${section(5, "Events", eventsHtml, a(`${SITE}/events`, "All events"))}
<tr><td style="padding:18px 24px 6px">${p(`Spot a code we missed? ${a(`${SITE}/submit`, "Send it in")}.`)}</td></tr>
<tr><td style="padding:14px 24px 22px;background:#fafafa;border-top:1px solid ${C.line}">
  <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${C.mute}">${sponsorHtml}</p>
  <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${C.mute}">You're getting this because you signed up at ${a(SITE, SITE_HOST)}. Fan-made; not affiliated with Smilegate or Super Creative.</p>
  <p style="margin:0;font-size:12px;color:${C.mute}"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${C.mute};text-decoration:underline">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

function renderText(I) {
  const L = [];
  L.push(`E7 THIS WEEK · ${I.issueLabel}`, "");
  L.push(I.sponsor ? `Sponsored by ${I.sponsor.name}: ${I.sponsor.message} ${SITE}/go/${I.sponsor.slug}` : `Sponsored by: Your game/creator here — ${SITE_HOST}/sponsor`, "");
  L.push("1) WORKING CODES");
  if (I.codes.length) for (const c of I.codes) L.push(`- ${c.code}${c.rewards ? ` (${c.rewards})` : ""}${c.expires_at ? `, ends ${fmt(c.expires_at, "date")}` : ""}`);
  else L.push("- None confirmed this week.");
  L.push(`Redeem: ${REDEEM_URL}`, "");
  L.push("2) ON THE BANNER NOW");
  for (const b of I.current) L.push(`- ${b.hero || b.title}${b.ends_at ? `, ends ${fmt(b.ends_at, b.time_precision)}` : ""}`);
  if (!I.current.length) L.push("- Nothing confirmed.");
  L.push("", "3) NEXT BANNER");
  for (const b of I.nextGroup) L.push(`- ${b.hero || b.title}, starts ${fmt(b.starts_at, b.time_precision)} (${inDays(daysFrom(startMs(b)))})`);
  if (!I.nextGroup.length) L.push("- Not announced yet.");
  L.push("", "4) RERUN WATCH");
  if (I.backNow.length) L.push(`Back now or announced: ${I.backNow.join(", ")}`);
  for (const r of I.reruns) L.push(`- ${r.hero}: ${r.days} days since last run`);
  L.push(`Get an email when your hero is back: ${SITE}/reruns`, "");
  L.push("5) EVENTS");
  for (const e of I.events) L.push(`- ${e.name}${e.ends_at ? `, ends ${fmt(e.ends_at, e.time_precision)}` : ""}`);
  if (!I.events.length) L.push("- None tracked.");
  L.push("", `Spot a code we missed? ${SITE}/submit`, "", `Fan-made; not affiliated with Smilegate. Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}`);
  return L.join("\n");
}

// ---------- Resend (draft only, never sends) ----------
async function resend(method, path, body) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Resend ${method} ${path} ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

async function saveDraft(I, html, text) {
  const segment = process.env.RESEND_SEGMENT_ID || process.env.RESEND_AUDIENCE_ID;
  const from = process.env.RESEND_FROM;
  if (!process.env.RESEND_API_KEY || !segment || !from) throw new Error("RESEND_API_KEY, RESEND_SEGMENT_ID and RESEND_FROM are required for --draft");
  const name = `E7 This Week ${I.isoDate}`;
  const body = { name, segment_id: segment, from, subject: I.subject, html, text, preview_text: I.preview };
  const list = await resend("GET", "/broadcasts");
  const existing = (list.data || []).find((b) => b.name === name && b.status === "draft");
  if (existing) {
    await resend("PATCH", `/broadcasts/${existing.id}`, body);
    return { id: existing.id, updated: true };
  }
  const created = await resend("POST", "/broadcasts", body);
  return { id: created.id, updated: false };
}

const data = await loadData();
const issue = buildIssue(data);
const html = renderHtml(issue);
const text = renderText(issue);
const out = opt("--preview");
if (out) {
  writeFileSync(out, html);
  writeFileSync(out.replace(/\.html?$/, "") + ".txt", text);
  console.log(`preview written: ${out}`);
}
console.log(`issue ${issue.isoDate} (data: ${data.source}) · subject: ${issue.subject}`);
console.log(`codes ${issue.codes.length} · current ${issue.current.length} · next ${issue.nextGroup.length} · reruns ${issue.reruns.length} · events ${issue.events.length} · sponsor ${issue.sponsor ? issue.sponsor.name : "open slot"}`);
if (flag("--draft")) {
  const r = await saveDraft(issue, html, text);
  console.log(`${r.updated ? "updated" : "created"} DRAFT broadcast ${r.id} (not sent; review and send it in Resend)`);
}
