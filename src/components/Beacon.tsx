"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Counts a pageview on every client navigation and reports uncaught errors. */
export function Beacon() {
  const path = usePathname();
  useEffect(() => {
    const body = JSON.stringify({ path, ref: document.referrer || null });
    try {
      if (!navigator.sendBeacon?.("/api/pv", new Blob([body], { type: "application/json" }))) throw 0;
    } catch {
      fetch("/api/pv", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  }, [path]);
  useEffect(() => {
    let sent = 0;
    const report = (message: string, stack?: string) => {
      if (sent++ > 5) return;
      fetch("/api/error-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, stack, path: location.pathname }),
        keepalive: true,
      }).catch(() => {});
    };
    const onErr = (e: ErrorEvent) => report(e.message, e.error?.stack);
    const onRej = (e: PromiseRejectionEvent) => report(String(e.reason?.message ?? e.reason), e.reason?.stack);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);
  return null;
}

let lastLogged = "";
export function logZeroResults(page: string, query: string) {
  const q = query.trim();
  if (q.length < 2 || q === lastLogged) return;
  lastLogged = q;
  fetch("/api/search-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, query: q }),
    keepalive: true,
  }).catch(() => {});
}
