"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterReset } from "./filter-controls";

/**
 * Mobile filter access — a trigger button + a right-side Sheet. The
 * server-rendered <FilterGroups> are passed in as children.
 */
export function MobileFilterSheet({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-lg border border-subtle bg-glass px-3 text-[12px] text-text-bright transition-colors hover:border-line lg:hidden"
        >
          <SlidersHorizontal size={13} />
          Filters
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[300px] gap-0 overflow-y-auto border-subtle bg-base p-0 text-text-primary"
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-subtle px-4 py-3">
          <SheetTitle className="text-[14px] text-text-primary">
            Filters
          </SheetTitle>
          <SheetDescription className="sr-only">
            Narrow the job listings by compensation, location, role, and more.
          </SheetDescription>
          <FilterReset />
        </SheetHeader>
        <div className="px-4 pb-10">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
