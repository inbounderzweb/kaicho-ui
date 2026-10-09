"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "../auth/AuthShell";
import ResendVerification from "../auth/ResendVerification";
import { IconCheck } from "../ui/icons";
import { useQueryClient } from "@tanstack/react-query";
import { verifyEmail, type AuthUser } from "@/lib/api/auth";
import { authKeys } from "@/lib/hooks/query-keys";

const REDIRECT_DELAY_MS = 1500;

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Captured once: Next syncs window.history.replaceState into
  // useSearchParams, so reading it live would see the token vanish the moment
  // we strip it from the URL below.
  const [token] = useState(() => searchParams.get("token"));
  const queryClient = useQueryClient();
  // Plain state rather than useMutation: this call is one-shot and must not
  // repeat, and under StrictMode's simulated remount a mutation observer is
  // detached, so the result of a mutate() fired from the first effect pass
  // would never reach this component.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [failedRequest, setFailedRequest] = useState(false);

  // The token is single-use: React StrictMode runs effects twice in dev, and
  // a second request would burn it and flip a success into a failure.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then((data) => {
        // Verification also signs the user in (the backend set the session
        // cookie), so prime auth/me exactly like a normal login.
        queryClient.setQueryData(authKeys.me, data.user);
        setUser(data.user);
      })
      .catch(() => setFailedRequest(true));
    // Keep the one-time token out of the address bar / history once consumed.
    window.history.replaceState(null, "", "/verify-email");
  }, [token, queryClient]);

  useEffect(() => {
    if (!user) return;
    // Fixed destinations only - this page deliberately accepts no redirect
    // parameter, so there is nothing for an attacker to point elsewhere.
    const id = setTimeout(
      () => router.replace(user.role === "admin" ? "/admin" : "/"),
      REDIRECT_DELAY_MS
    );
    return () => clearTimeout(id);
  }, [user, router]);

  const failed = !token || failedRequest;

  if (failed) {
    return (
      <AuthShell
        title="Verification failed"
        footer={
          <Link href="/login" className="font-semibold text-forest hover:text-brand-dark">
            Back to login
          </Link>
        }
      >
        <div className="space-y-5">
          <p role="alert" className="text-center text-sm font-semibold text-sale">
            Verification link is invalid or expired.
          </p>
          <p className="text-center text-xs text-ink-muted">
            Enter your email and we&apos;ll send you a new link.
          </p>
          <ResendVerification />
        </div>
      </AuthShell>
    );
  }

  if (user) {
    return (
      <AuthShell title="You're all set">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg shadow-brand/25">
            <IconCheck className="h-7 w-7 text-white" strokeWidth={3} />
          </span>
          <p role="status" className="text-sm font-semibold text-ink">
            Email verified successfully.
          </p>
          <p className="text-xs text-ink-muted">Taking you to Kaicho…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verifying your email">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-4">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-forest/20 border-t-forest" />
        <p className="text-sm text-ink-muted">Please wait while we verify your email…</p>
      </div>
    </AuthShell>
  );
}
