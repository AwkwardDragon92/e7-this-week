# E7 This Week

A fast, mobile-first Epic Seven tracker: working codes, current/upcoming/past banners, Rerun Watch for limited heroes, live events, player code submissions, a Thursday newsletter signup, and one sponsor slot.

Live URL (planned): https://epic7.awkwarddragon.com

Fan site. Not affiliated with Smilegate.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Postgres via [`postgres`](https://github.com/porsager/postgres) using `DATABASE_URL` (Neon from the Vercel Marketplace works as-is)
- Optional Resend for the newsletter audience and owner notifications

**No database? No problem.** If `DATABASE_URL` is missing, every page renders from `data/*.json` (the sourced seed data), `npm run build` works, and forms answer "opens soon".

## Local development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL to use a database
npm run db:migrate           # creates tables (safe to re-run)
npm run db:seed              # upserts data/*.json (safe to re-run)
npm run dev
```

## Pages

| Route | What it does |
|---|---|
| `/` | Working codes with copy buttons + STOVE redeem link, current banner with live countdown (UTC + your local time), what's next, email signup |
| `/codes` | Working, unconfirmed and expired codes with rewards, found date, end date, source; search |
| `/banners` | Current, upcoming and past banners; filter by element and type (limited/pickup/class/group/mystic); search by hero/artifact |
| `/reruns` | Every limited hero, last run, days since; "email me when they're back" (`rerun_alerts`) |
| `/events` | Live events and end dates |
| `/submit` | Players submit a code → `submissions` (pending) |
| `/sponsor` | Real stats from the DB (shows "New site" when zero), the offer, contact form → `sponsor_inquiries` (+ email to owner via Resend if configured) |
| `/go/[slug]` | Sponsor redirect that logs a click |
| `/sitemap.xml`, `/robots.txt`, `/opengraph-image` | SEO |

Code status is recomputed on every read: anything past its end date shows as expired automatically. Pages revalidate every 5 minutes.

## Tracking (all first-party, in Postgres)

- `pageviews`: a tiny client beacon (`/api/pv`) on each navigation; bots skipped
- `zero_result_searches`: searches on /codes and /banners that found nothing
- `errors`: server data errors and client errors (`/api/error-log`)

## Admin API

Every admin route needs `Authorization: Bearer $ADMIN_TOKEN` (token must be 16+ characters; admin is disabled otherwise).

```bash
T="Authorization: Bearer $ADMIN_TOKEN"; S=https://epic7.awkwarddragon.com

curl -H "$T" $S/api/admin/queue                     # pending submissions
curl -H "$T" -H 'Content-Type: application/json' $S/api/admin/approve \
  -d '{"id":12,"action":"approve","rewards":"3 Leif","expires_at":"2026-11-20T14:59:00Z"}'
curl -H "$T" -H 'Content-Type: application/json' $S/api/admin/approve -d '{"id":13,"action":"reject","note":"fake"}'
curl -H "$T" $S/api/admin/stats                     # subscribers, pageviews, top pages, referrers, rerun demand, errors
curl -H "$T" -H 'Content-Type: application/json' $S/api/admin/delete -d '{"email":"someone@x.com"}'  # remove a subscriber (or {"submission_id":13})
curl -H "$T" $S/api/admin/searches                  # zero-result searches (last 30 days)
curl -H "$T" $S/api/admin/sponsors                  # sponsors, weeks, clicks, inquiries

# Book a sponsor week (shows the closable sponsor bar sitewide while active)
curl -H "$T" -H 'Content-Type: application/json' $S/api/admin/sponsors -d '{
  "slug":"acme","name":"Acme Games","url":"https://acme.example/?utm_source=e7thisweek",
  "week":{"starts_at":"2026-11-19T03:00:00Z","ends_at":"2026-11-26T03:00:00Z","message":"New gacha, 100 free pulls","cta":"Play free","price_usd":25}}'

# Content updates (same fields as data/*.json). Upserts by code / id.
curl -H "$T" -H 'Content-Type: application/json' $S/api/admin/upsert -d '{
  "type":"codes","items":[{"code":"NEWCODE","rewards":"3 Leif","status":"active","expires_at":"2026-11-30T14:59:00Z","source_name":"Official X","source_url":"https://x.com/Epic7_Global"}]}'
curl -H "$T" -H 'Content-Type: application/json' $S/api/admin/upsert -d '{"type":"banners","items":[{"id":"P202611-02","title":"...","type":"limited","hero":"...","starts_at":"2026-11-26T03:00:00Z","ends_at":"2026-12-17T02:59:00Z","notice_url":"https://page.onstove.com/..."}]}'
curl -H "$T" -H 'Content-Type: application/json' $S/api/admin/upsert -d '{"type":"codes","delete":["OLDCODE"]}'
```

Content changes revalidate all pages immediately.

## Seed data and sources

All seed rows are real and carry their source URL. Fields a source did not state are left empty. Read on 2026-11-12 (US Eastern):

- Codes: https://gachafeed.moe/epic7/codes/ and https://www.redeem-code-tracker.com/games/epic-seven
- Banners (Dec 2020 to now, each with its official STOVE notice link): https://bannerhistory.app/en/e7-pickup-history
- Mystic banner and events: https://www.epicseven.site/wiki/next-banner

Statuses: **active** = a source states a future end date; **unconfirmed** = listed as valid by one tracker with no end date; **expired** = end date passed.

`scripts/build-seed.py` rebuilds `data/*.json` from fresh snapshots of those pages.

## Deploy (Vercel)

1. Import this repo in Vercel (framework: Next.js, defaults are fine).
2. Storage → add **Neon Postgres** from the Marketplace and connect it to the project; it sets `DATABASE_URL`.
3. Set env vars: `NEXT_PUBLIC_SITE_URL=https://epic7.awkwarddragon.com`, `ADMIN_TOKEN` (`openssl rand -hex 24`), and optionally `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `OWNER_EMAIL`, `RESEND_FROM`.
4. Set the project's Build Command to `npm run build:vercel`. Every build then runs migrations (idempotent) and seeds only if the `codes` table is empty, so no connection string ever leaves Vercel. To force a re-seed from your machine: `vercel env pull .env.local && npm run db:seed`.
5. Domains → add `epic7.awkwarddragon.com`, then at your DNS provider add a `CNAME` record `epic7` → `cname.vercel-dns.com` (Vercel shows the exact value).
6. Redeploy so pages pick up the DB.

### Env vars

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | for forms/stats | Postgres connection string |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical URL for metadata, sitemap, OG |
| `ADMIN_TOKEN` | for admin API | Bearer token (16+ chars) |
| `RESEND_API_KEY` | optional | Resend API key |
| `RESEND_SEGMENT_ID` | optional | Signups get added to this Resend segment (needs a full-access key; sending-only keys skip it and signups stay in Postgres) |
| `RESEND_AUDIENCE_ID` | optional | Legacy fallback for `RESEND_SEGMENT_ID` |
| `OWNER_EMAIL` | optional | Where sponsor inquiries get emailed |
| `RESEND_FROM` | optional | Sender for owner emails (verified domain); defaults to Resend's onboarding sender |

## Weekly newsletter (Thursday)

`npm run newsletter:draft` builds the upcoming Thursday's issue from the live database (via `/api/admin/newsletter-data`, needs `ADMIN_TOKEN`) and creates or updates a **draft** Resend broadcast for the `RESEND_SEGMENT_ID` segment from `RESEND_FROM`. It never sends: review the draft in Resend and hit send there.
`npm run newsletter:preview` writes `newsletter-preview.html` / `.txt` without touching Resend. Add `--local` to use `data/*.json`, `--date YYYY-MM-DD` for a different Thursday.
Five picks: working codes, current banner, next banner (with start date), rerun watch, events. The "Sponsored by" line shows the sponsor week covering send time, or "Your game/creator here" linking to /sponsor. Unsubscribe uses Resend's `{{{RESEND_UNSUBSCRIBE_URL}}}`.
