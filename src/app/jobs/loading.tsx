import { GlassNav } from "@/components/layout/glass-nav";

/* Skeleton shown while /jobs re-fetches (force-dynamic over Neon, which can
   cold-start). Mirrors the real 3-column layout so the swap is calm. */
function Bar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-glass-hi ${className}`} />
  );
}

export default function JobsLoading() {
  return (
    <div className="min-h-dvh pb-16">
      <GlassNav />

      <section className="mx-auto max-w-[1240px] px-5 py-6 md:px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_300px] lg:grid-cols-[232px_1fr_300px]">
          {/* filter sidebar */}
          <div className="hidden flex-col gap-5 lg:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5">
                <Bar className="h-3 w-24" />
                <Bar className="h-2.5 w-full" />
                <Bar className="h-2.5 w-4/5" />
                <Bar className="h-2.5 w-3/5" />
              </div>
            ))}
          </div>

          {/* feed */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-col gap-2">
              <Bar className="h-2.5 w-40" />
              <Bar className="h-6 w-32" />
            </div>
            <div className="cw-card overflow-hidden rounded-2xl">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-4 ${
                    i > 0 ? "border-t border-subtle" : ""
                  }`}
                >
                  <Bar className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Bar className="h-3.5 w-1/2" />
                    <Bar className="h-2.5 w-3/4" />
                  </div>
                  <Bar className="hidden h-8 w-20 shrink-0 rounded-lg sm:block" />
                </div>
              ))}
            </div>
          </div>

          {/* side panels */}
          <div className="hidden flex-col gap-4 md:flex">
            <Bar className="h-44 w-full rounded-2xl" />
            <Bar className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
