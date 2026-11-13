#!/usr/bin/env python3
"""Rebuild data/*.json from saved snapshots of the source pages.

Usage:
  mkdir -p /tmp/e7src && cd /tmp/e7src
  curl -sL -A "Mozilla/5.0" https://gachafeed.moe/epic7/codes/ -o gachafeed.html
  curl -sL -A "Mozilla/5.0" https://bannerhistory.app/en/e7-pickup-history -o bannerhistory.html
  python3 scripts/build-seed.py /tmp/e7src

Codes from redeem-code-tracker.com and events from epicseven.site are
hand-transcribed in this file (their pages render the data as text only).
Nothing here is invented: every row carries the URL it came from. Fields a
source did not state are left null.
"""
import json, re, sys, os
from datetime import datetime, timezone

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/e7src"
OUT = os.path.join(os.path.dirname(__file__), "..", "data")
CHECKED = "2026-11-12"  # date the sources were read (US Eastern)
NOW = datetime(2026, 11, 13, 2, 0, tzinfo=timezone.utc)  # 2026-11-12 9pm ET

GF = "https://gachafeed.moe/epic7/codes/"
RCT = "https://www.redeem-code-tracker.com/games/epic-seven"
BH = "https://bannerhistory.app/en/e7-pickup-history"
E7S = "https://www.epicseven.site/wiki/next-banner"

def iso(s):
    return s if s is None else datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def status_for(expires, listed):
    if expires and datetime.fromisoformat(expires.replace("Z", "+00:00")) < NOW:
        return "expired"
    return listed

# ---------- codes: gachafeed (structured JSON embedded in page) ----------
codes = []
gf = open(os.path.join(SRC, "gachafeed.html"), encoding="utf8").read()
for m in re.finditer(r'\{[^{}]*"game":"epic7"[^{}]*"code":"[^"]+"[^{}]*\}', gf):
    o = json.loads(m.group(0))
    exp = iso(o.get("expiresAt"))
    codes.append({
        "code": o["code"],
        "rewards": None,  # gachafeed: "Not stated"
        "status": status_for(exp, "active" if o["status"] == "active" else "expired"),
        "found_at": iso(o["firstSeenAt"]),
        "expires_at": exp,
        "source_name": "Gachafeed",
        "source_url": GF,
        "note": "End date read from code image by source" if o.get("expiresFromImage") else None,
    })

# ---------- codes: redeem-code-tracker (transcribed 2026-11-12) ----------
# (code, rewards or None, added-on date, valid-until date or None, origin)
RCT_ROWS = [
    ("Epic7_8TH_MrPokke", "4 Leif, 4 Greater Equipment Charms", "2026-09-20", None, "contributor"),
    ("Epic7_8TH_Dkayed", "4 Leif, 4 Greater Equipment Charms", "2026-09-20", None, "contributor"),
    ("Epic7_8TH_fobm4ster", "5 Leif, 5 Greater Equipment Charms", "2026-09-20", None, "contributor"),
    ("Epic7_8TH_imTsu", None, "2026-09-20", None, "contributor"),
    ("K7M2Q9", "500,000 Gold", "2026-09-20", None, "contributor"),
    ("N9C5R2", "3 MolaGora", "2026-09-20", None, "contributor"),
    ("T6H1W4", "3 Greater Artifact Charms", "2026-09-20", None, "contributor"),
    ("B3X8L5", "3 Greater Equipment Charms", "2026-09-20", None, "contributor"),
    ("G1T7B9", "3 Greater Equipment Charms", "2026-09-20", None, "contributor"),
    ("C8P4Y2", "500,000 Gold", "2026-09-20", None, "contributor"),
    ("M2R8F4", "3 MolaGora", "2026-09-20", None, "contributor"),
    ("C5R1V9", "2 Leif", "2026-08-23", None, "contributor"),
    ("G4P9L6", "1 Epic Equipment Charm", "2026-08-23", None, "contributor"),
    ("A7K4Q2", "2 Leif", "2026-08-23", None, "contributor"),
    ("K7M2X9", "500,000 Gold", "2026-08-23", None, "contributor"),
    ("P4R8N3", "3 Greater Equipment Charms", "2026-08-23", None, "contributor"),
    ("T9B7L2", "3 Greater Artifact Charms", "2026-08-23", None, "contributor"),
    ("Y3F8D6", "3 MolaGora", "2026-08-23", None, "contributor"),
    ("TY_E8_INFINITY", "80 Gold Transmit Stones, 80 Greater Charm Selection Chests, 8,000,000 Gold", "2026-08-22", "2026-12-25", "official"),
    ("OUR8th_EPIC", "8 Epic Catalyst Chests", "2026-08-22", "2026-12-31", "official"),
    ("TOGETHER_8Y", "8 Rare Catalyst Chests", "2026-08-22", "2026-12-31", "contributor"),
    ("8TH_ANN", "8 Leif", "2026-08-20", "2026-12-31", None),
    ("DIENE_GIFTO219", None, "2026-04-15", None, None),
]
for code, rewards, found, until, origin in RCT_ROWS:
    # A future end date stated by the source => active. Listed as "Valid" but
    # with no end date => "unconfirmed" (one tracker says valid; nobody states
    # an end date, and Gachafeed's hand-checked list does not include it).
    exp = f"{until}T23:59:59Z" if until else None
    codes.append({
        "code": code,
        "rewards": rewards,
        "status": status_for(exp, "active" if until else "unconfirmed"),
        "found_at": f"{found}T00:00:00Z",
        "expires_at": exp,
        "source_name": "Redeem Code Tracker" + (f" ({origin} source)" if origin else ""),
        "source_url": RCT,
        "note": "End date given as a day only (time not stated)" if until else "Listed as valid; no end date stated",
    })

# ---------- banners: bannerhistory (structured records in page payload) ----------
bh = open(os.path.join(SRC, "bannerhistory.html"), encoding="utf8").read()
chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>', bh, flags=re.S)
flight = "".join(json.loads('"' + c + '"') for c in chunks)
dec = json.JSONDecoder()
recs = {}
for m in re.finditer(r'\{"id":"[A-Z]?\d{6}-\d+"', flight):
    try:
        o, _ = dec.raw_decode(flight, m.start())
    except Exception:
        continue
    if "startUtc" in o:
        recs[o["id"]] = o
KIND = {"limited": "limited", "pickup": "pickup", "class-summon": "class", "limited-group": "group"}
banners = []
for o in sorted(recs.values(), key=lambda r: r["startUtc"]):
    banners.append({
        "id": o["id"],
        "title": o["title"],
        "type": KIND.get(o["kind"], o["kind"]),
        "hero": o.get("hero"),
        "artifact": o.get("artifact"),
        "element": o.get("element"),
        "hero_class": o.get("class"),
        "starts_at": iso(o["startUtc"]),
        "ends_at": iso(o.get("endUtc")),
        "time_precision": "exact",
        "notice_url": o.get("url"),
        "source_url": BH,
    })
# Mystic summon (not in BannerHistory's drop-rate-up archive)
banners.append({
    "id": "M202610-01",
    "title": "Bunny Girl Great Detective Moro (Mystic Summon)",
    "type": "mystic",
    "hero": "Bunny Girl Great Detective Moro",
    "artifact": None,
    "element": None,
    "hero_class": None,
    "starts_at": "2026-10-29T00:00:00Z",
    "ends_at": "2026-11-19T00:00:00Z",
    "time_precision": "date",
    "notice_url": None,
    "source_url": E7S,
})

# ---------- events: epicseven.site (checked Oct 31, 2026) ----------
events = [
    {"id": "secret-rabbit-hole", "name": "Secret Rabbit\u2665Hole side story", "kind": "side-story",
     "description": "Bunny Girl side story with Level 88 equipment rewards. Collecting all five Bunny Girl heroes and skins on the event's Quick Link page rewards Self-Proclaimed Detective Toby.",
     "rewards": "Level 88 equipment; Self-Proclaimed Detective Toby (collection reward)",
     "starts_at": None, "ends_at": "2026-12-10T00:00:00Z", "time_precision": "date", "source_url": E7S},
    {"id": "yufine-preview-video", "name": "Bunny Girl Mafia Yufine preview video event", "kind": "event",
     "description": "Watch the new hero preview video.", "rewards": "1 Leif",
     "starts_at": "2026-11-05T00:00:00Z", "ends_at": "2026-11-26T00:00:00Z", "time_precision": "date", "source_url": E7S},
    {"id": "moro-try-hero-preview", "name": "Bunny Girl Great Detective Moro try-hero & preview video events", "kind": "event",
     "description": "Try-hero and preview-video events for the new Moonlight hero.", "rewards": "1 Leif each",
     "starts_at": None, "ends_at": "2026-11-19T00:00:00Z", "time_precision": "date", "source_url": E7S},
    {"id": "foundry-free-summons", "name": "Steam Foundry server: 20 free Covenant Summons a day", "kind": "event",
     "description": "Players on the Steam Foundry server receive 20 free Covenant Summons a day.", "rewards": "20 Covenant Summons per day",
     "starts_at": None, "ends_at": "2026-12-31T00:00:00Z", "time_precision": "date", "source_url": E7S},
    {"id": "coin-shops-2026-11", "name": "Covenant & Galaxy Coin Shop: November heroes", "kind": "shop",
     "description": "Covenant Coin Shop: Fenne, Abigail, Ray, Destina, Violet. Galaxy Coin Shop: Witch of the Mere Tenebria, Abyssal Yufine, Eternal Wanderer Ludwig, Dragon King Sharun, Silver Blade Aramintha. Both shops now offer five heroes a month instead of three.",
     "rewards": None, "starts_at": "2026-11-01T00:00:00Z", "ends_at": None, "time_precision": "date", "source_url": E7S},
]

meta = {
    "checked": CHECKED,
    "sources": [
        {"name": "Gachafeed", "url": GF, "used_for": "codes (found/end dates, status)"},
        {"name": "Redeem Code Tracker", "url": RCT, "used_for": "codes (rewards, added dates, end dates)"},
        {"name": "BannerHistory", "url": BH, "used_for": "drop-rate-up banner archive with links to official STOVE notices"},
        {"name": "Epic Seven Wiki (epicseven.site)", "url": E7S, "used_for": "mystic banner and current events"},
    ],
}
for name, obj in [("codes", codes), ("banners", banners), ("events", events), ("meta", meta)]:
    with open(os.path.join(OUT, f"{name}.json"), "w", encoding="utf8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
from collections import Counter
print("codes", len(codes), Counter(c["status"] for c in codes))
print("banners", len(banners), Counter(b["type"] for b in banners))
print("events", len(events))
