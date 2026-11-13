import type { Metadata } from "next";
import { CodesBrowser } from "@/components/CodesBrowser";
import { getCodes } from "@/lib/data";
import { REDEEM_URL } from "@/lib/site";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Epic Seven codes: working and expired coupons",
  description: "Every Epic Seven coupon code we track, with rewards, found date, end date and source. Copy a code and redeem it on the official STOVE page.",
  alternates: { canonical: "/codes" },
};

export default async function CodesPage() {
  const codes = await getCodes();
  return (
    <div>
      <h1 className="text-2xl font-black text-white">Epic Seven codes</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Redeem at the{" "}
        <a href={REDEEM_URL} target="_blank" rel="noopener" className="text-violet-300 underline">
          official STOVE coupon page
        </a>
        . Each code works once per account. Rewards and end dates show only when a source states them.
      </p>
      <div className="mt-4">
        <CodesBrowser codes={codes} />
      </div>
    </div>
  );
}
