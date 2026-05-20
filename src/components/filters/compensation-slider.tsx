"use client";

import { useEffect, useState } from "react";
import { Slider } from "radix-ui";
import { useQueryStates } from "nuqs";
import { jobsSearchParams, SALARY_MIN, SALARY_MAX } from "@/lib/jobs-search-params";

/**
 * Dual-handle compensation range ($120k–$400k+). Drag updates the local
 * label live; the URL is written only on release (onValueCommit).
 */
export function CompensationSlider() {
  const [{ min, max }, setRange] = useQueryStates({
    min: jobsSearchParams.min,
    max: jobsSearchParams.max,
  });
  const [val, setVal] = useState<[number, number]>([min, max]);

  // follow external URL changes (reset, shared link)
  useEffect(() => {
    setVal([min, max]);
  }, [min, max]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between font-mono text-[11px] text-text-secondary">
        <span>${val[0]}k</span>
        <span>
          ${val[1]}k{val[1] >= SALARY_MAX ? "+" : ""}
        </span>
      </div>
      <Slider.Root
        className="relative flex h-4 w-full touch-none select-none items-center"
        min={SALARY_MIN}
        max={SALARY_MAX}
        step={10}
        minStepsBetweenThumbs={1}
        value={val}
        onValueChange={(v) => setVal([v[0], v[1]])}
        onValueCommit={(v) =>
          setRange({
            min: v[0] === SALARY_MIN ? null : v[0],
            max: v[1] === SALARY_MAX ? null : v[1],
          })
        }
      >
        <Slider.Track className="relative h-1 w-full grow rounded-full bg-surface-3">
          <Slider.Range className="absolute h-full rounded-full bg-gradient-brand" />
        </Slider.Track>
        {[0, 1].map((i) => (
          <Slider.Thumb
            key={i}
            aria-label={i === 0 ? "Minimum salary" : "Maximum salary"}
            className="block h-3.5 w-3.5 rounded-full border border-line bg-text-primary shadow-[0_0_8px_oklch(0.6_0.18_270/0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
          />
        ))}
      </Slider.Root>
    </div>
  );
}
