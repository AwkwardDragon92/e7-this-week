export type CodeStatus = "active" | "unconfirmed" | "expired";
export type Code = {
  code: string;
  rewards: string | null;
  status: CodeStatus;
  found_at: string | null;
  expires_at: string | null;
  source_name: string | null;
  source_url: string | null;
  note: string | null;
};

export type BannerType = "limited" | "pickup" | "class" | "group" | "mystic";
export type Banner = {
  id: string;
  title: string;
  type: BannerType;
  hero: string | null;
  artifact: string | null;
  element: string | null;
  hero_class: string | null;
  starts_at: string;
  ends_at: string | null;
  time_precision: "exact" | "date";
  notice_url: string | null;
  source_url: string | null;
};

export type GameEvent = {
  id: string;
  name: string;
  kind: string | null;
  description: string | null;
  rewards: string | null;
  starts_at: string | null;
  ends_at: string | null;
  time_precision: "exact" | "date";
  source_url: string | null;
};

export type LimitedHero = {
  hero: string;
  element: string | null;
  hero_class: string | null;
  runs: number;
  last_start: string;
  last_end: string | null;
  last_notice_url: string | null;
};

export type SponsorSlot = {
  week_id: number;
  slug: string;
  name: string;
  message: string;
  cta: string | null;
  ends_at: string;
};
