import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GlassNav } from "@/components/layout/glass-nav";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/** Only an internal path may be used as the post-sign-in destination. */
function safeNext(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/me";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const callbackURL = safeNext(next);

  // Already signed in — skip straight to the destination.
  if (await getServerSession()) redirect(callbackURL);

  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto flex max-w-[420px] flex-col px-5 py-20 md:py-28">
          <div className="rounded-2xl border border-subtle bg-surface p-6">
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">
              Sign in
            </h1>
            <div className="mt-4">
              <SignInPanel callbackURL={callbackURL} />
            </div>
          </div>
          <p className="mt-4 text-center text-[12px] text-text-tertiary">
            New here? Signing in creates your account.
          </p>
        </div>
      </main>
    </div>
  );
}
