"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SignInPanel } from "./sign-in-panel";

/**
 * Sign-in dialog — opened from the glass nav. After sign-in the user is
 * returned to the page they were on.
 */
export function SignInDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="border-subtle bg-elevated sm:max-w-[380px]">
        <DialogTitle className="text-[16px] font-semibold text-text-primary">
          Sign in to Chainwork
        </DialogTitle>
        <DialogDescription className="sr-only">
          Sign in with GitHub or an email magic link.
        </DialogDescription>
        <SignInPanel callbackURL={pathname} />
      </DialogContent>
    </Dialog>
  );
}
