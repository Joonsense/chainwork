"use client";

import Link from "next/link";
import { SignInDialog } from "./sign-in-dialog";

type NavUser = { name: string } | null;

/**
 * Glass-nav auth slot. Signed out → a "Sign in" button that opens the
 * dialog. Signed in → a monogram link to /me. The signed-in state is
 * resolved on the server and passed in, so there is no auth flash.
 */
export function NavAuth({
  user,
  variant,
}: {
  user: NavUser;
  variant: "desktop" | "mobile";
}) {
  if (user) {
    const name = user.name?.trim() || "Account";
    const initial = name[0]!.toUpperCase();
    const firstName = name.split(/\s+/)[0];

    if (variant === "mobile") {
      return (
        <Link
          href="/me"
          aria-label="Your account"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-glass-hi text-[12px] font-semibold text-text-primary"
        >
          {initial}
        </Link>
      );
    }
    return (
      <Link
        href="/me"
        className="flex h-[30px] items-center gap-2 rounded-lg border border-subtle bg-glass py-px pl-1 pr-2.5 text-[13px] font-medium text-text-bright transition-colors hover:border-line"
      >
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-line bg-glass-hi text-[11px] font-semibold text-text-primary">
          {initial}
        </span>
        {firstName}
      </Link>
    );
  }

  const triggerClass =
    variant === "desktop"
      ? "h-[30px] rounded-lg border border-subtle bg-glass px-3 text-[13px] font-medium text-text-bright transition-colors hover:border-line"
      : "cw-apply h-8 px-3 text-[12px]";

  return (
    <SignInDialog
      trigger={
        <button type="button" className={triggerClass}>
          Sign in
        </button>
      }
    />
  );
}
