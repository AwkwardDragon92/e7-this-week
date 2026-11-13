"use client";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch("/api/error-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message || "render error", stack: error.stack, path: location.pathname }),
    }).catch(() => {});
  }, [error]);
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-bold text-white">Something broke.</h1>
      <p className="mt-2 text-zinc-400">It&apos;s been logged. Try again?</p>
      <button onClick={reset} className="mt-4 rounded-xl bg-violet-500 px-4 py-2 font-semibold text-white">
        Retry
      </button>
    </div>
  );
}
