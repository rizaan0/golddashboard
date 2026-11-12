import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Not Found" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <h1>Record not found</h1>
        <Link className="mt-4 inline-block text-[17px] leading-[22px] tracking-[-0.43px] text-[#007aff]" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
