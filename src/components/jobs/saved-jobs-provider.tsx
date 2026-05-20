"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * Client store for saved-job state (P9). One fetch of `/api/saved` on
 * mount hydrates every bookmark on the page, so cards (and load-more
 * rows) stay in sync without per-card requests.
 */
type SavedJobsContext = {
  authed: boolean;
  ready: boolean;
  isSaved: (slug: string) => boolean;
  toggle: (slug: string) => Promise<void>;
};

const Ctx = createContext<SavedJobsContext | null>(null);

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    fetch("/api/saved")
      .then((r) => (r.ok ? r.json() : { authed: false, slugs: [] }))
      .then((data: { authed: boolean; slugs: string[] }) => {
        if (!active) return;
        setAuthed(data.authed);
        setSaved(new Set(data.slugs));
        setReady(true);
      })
      .catch(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  const isSaved = useCallback((slug: string) => saved.has(slug), [saved]);

  const flip = (slug: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const toggle = useCallback(async (slug: string) => {
    flip(slug); // optimistic
    try {
      const res = await fetch(`/api/saved/${slug}`, { method: "POST" });
      if (!res.ok) throw new Error("toggle failed");
      const { saved: nowSaved } = (await res.json()) as { saved: boolean };
      setSaved((prev) => {
        const next = new Set(prev);
        if (nowSaved) next.add(slug);
        else next.delete(slug);
        return next;
      });
    } catch {
      flip(slug); // revert
    }
  }, []);

  return (
    <Ctx.Provider value={{ authed, ready, isSaved, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSavedJobs(): SavedJobsContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useSavedJobs must be used within <SavedJobsProvider>");
  }
  return ctx;
}
