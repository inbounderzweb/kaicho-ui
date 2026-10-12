"use client";

import GoogleSignInButton, { GOOGLE_SIGN_IN_ENABLED } from "../login/GoogleSignInButton";
import { useGoogleLogin } from "@/lib/hooks/useGoogleLogin";
import { friendlyAuthError, type AuthUser } from "@/lib/api/auth";

/**
 * "Or" divider + "Continue with Google". The ID token goes to the backend,
 * which verifies it with Google - nothing here is trusted. Renders nothing
 * when NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't set.
 */
export default function GoogleAuthSection({
  onAuthenticated,
}: {
  onAuthenticated: (user: AuthUser, requiresName: boolean) => void;
}) {
  const googleLogin = useGoogleLogin();

  if (!GOOGLE_SIGN_IN_ENABLED) return null;

  const status = googleLogin.isPending ? "Signing you in…" : friendlyAuthError(googleLogin.error);

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleSignInButton
        onCredential={(credential) =>
          googleLogin.mutate(credential, {
            onSuccess: (data) => onAuthenticated(data.user, data.requiresName),
          })
        }
        disabled={googleLogin.isPending}
        statusText={status}
      />
    </>
  );
}
