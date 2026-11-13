import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-bold text-white">Page not found</h1>
      <Link href="/" className="mt-4 inline-block text-violet-300 underline">
        Back to this week
      </Link>
    </div>
  );
}
