"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, FileCheck, Loader2, Upload } from "lucide-react";

type Result = { skills: string[]; ecosystems: string[] };

/** CV upload + result (P10). PDF/DOCX → skill extraction → AI matching. */
export function CvUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("cv", file);
      const res = await fetch("/api/cv", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.");
        return;
      }
      setResult(data as Result);
      toast.success("CV processed — you're matched.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-subtle bg-surface p-7 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-green/30 bg-accent-green/10">
          <FileCheck size={22} className="text-accent-green" />
        </span>
        <div className="text-[15px] font-semibold text-text-primary">
          CV processed
        </div>
        {result.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {result.skills.slice(0, 12).map((s) => (
              <span
                key={s}
                className="rounded-md border border-line bg-glass-hi px-2 py-0.5 text-[11.5px] text-text-bright"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <Link href="/jobs?sort=fit" className="cw-apply mt-1 h-10 px-5 text-[13px]">
          See your matches
          <ArrowRight size={14} strokeWidth={2.4} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-subtle bg-surface p-6">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-line py-12 transition-colors hover:border-strong disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={22} className="animate-spin text-accent-blue" />
        ) : (
          <Upload size={22} className="text-text-tertiary" />
        )}
        <span className="text-[13.5px] font-medium text-text-primary">
          {loading ? "Reading your CV…" : "Choose a PDF or DOCX file"}
        </span>
        <span className="font-mono text-[11px] text-text-muted">
          Max 8MB · PDF or DOCX
        </span>
      </button>
    </div>
  );
}
