import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-surface text-on-surface flex min-h-[70vh] items-center justify-center px-6 py-16">
      <section className="animate-fade-in border-surface-container-high bg-surface-container-lowest max-w-lg rounded-2xl border p-8 text-center shadow-sm">
        <div className="bg-surface-container text-surface-tint mx-auto mb-5 flex size-12 items-center justify-center rounded-xl">
          <SearchX className="size-6" aria-hidden="true" />
        </div>
        <p className="text-outline text-xs font-semibold uppercase tracking-[0.24em]">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-on-surface-variant mt-3 text-sm leading-6">
          The page may have moved, or the symbol route you opened is no longer
          available.
        </p>
        <Button asChild className="mt-6 h-10 px-4">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Go to Dashboard
          </Link>
        </Button>
      </section>
    </main>
  );
}
