import { apiFetch } from "./client";
import { ApiError } from "./ApiError";
import type { UserRole } from "../constants/roles";

export type { UserRole };

export interface AuthUser {
  id: string;
  /** Absent for accounts created via Google that haven't added a phone yet. */
  phone?: string;
  countryCode: string;
  phoneVerified: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
  /** null/absent = never asked. Delivered with /auth/me, so no extra request. */
  trackingConsent?: { granted: boolean; updatedAt: string } | null;
}

export interface SendOtpResult {
  sent: boolean;
  /** Seconds the user must wait before a resend is allowed — drives the
   *  login screen's "Resend OTP in 00:xx" countdown. */
  resendAfter: number;
}

export function sendOtp(phone: string): Promise<SendOtpResult> {
  return apiFetch<SendOtpResult>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

/**
 * Seconds still to wait before another OTP can be requested, pulled from a
 * 429 rejection. Prefers the structured `retryAfter` detail; falls back to
 * the integer in the message ("Please wait 28s before requesting another
 * OTP"). Returns null when `error` isn't an OTP cooldown rejection — e.g. a
 * plain "too many requests" throttle with no seconds in it.
 */
export function otpRetryAfterSeconds(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) return null;
  const detail = (error.details as { retryAfter?: unknown } | undefined)?.retryAfter;
  if (typeof detail === "number" && detail > 0) return Math.ceil(detail);
  const match = /(\d+)\s*s\b/.exec(error.message);
  return match ? Number(match[1]) : null;
}

export function verifyOtp(
  phone: string,
  otp: string
): Promise<{ user: AuthUser; requiresName: boolean }> {
  return apiFetch<{ user: AuthUser; requiresName: boolean }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, otp }),
  });
}

/**
 * Exchange a Google ID token (the `credential` string from Google Identity
 * Services) for a Kaicho session. Same response shape as verifyOtp so the
 * login screen can share the post-auth flow.
 */
export function loginWithGoogle(
  credential: string
): Promise<{ user: AuthUser; requiresName: boolean }> {
  return apiFetch<{ user: AuthUser; requiresName: boolean }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

/** The backend's machine-readable code for "right password, email not verified yet". */
export const EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED";

export function isEmailNotVerifiedError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    (error.details as { code?: unknown } | undefined)?.code === EMAIL_NOT_VERIFIED
  );
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/** Creates an UNVERIFIED account and emails a link. Does not sign the user in. */
export function registerAccount(input: RegisterInput): Promise<{ registered: boolean }> {
  return apiFetch<{ registered: boolean }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginWithPassword(
  email: string,
  password: string
): Promise<{ user: AuthUser; requiresName: boolean }> {
  return apiFetch<{ user: AuthUser; requiresName: boolean }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** Exchanges the emailed one-time token for a verified account + session. */
export function verifyEmail(token: string): Promise<{ user: AuthUser; requiresName: boolean }> {
  return apiFetch<{ user: AuthUser; requiresName: boolean }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export interface ResendVerificationResult {
  sent: boolean;
  /** Seconds before another resend will actually send - drives the countdown. */
  resendAfter: number;
}

export function resendVerification(email: string): Promise<ResendVerificationResult> {
  return apiFetch<ResendVerificationResult>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Message safe to show a user. Client-error messages from the auth endpoints
 * are deliberately generic/validation-level, so they pass through; anything
 * else (5xx, network, unparseable) collapses to a neutral line instead of
 * leaking server internals.
 */
export function friendlyAuthError(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function updateName(name: string): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

/**
 * Attach a mobile number to the current account. Used by the checkout
 * phone-required gate for accounts (Google sign-in) that have none yet.
 * Rejects with a 409 ApiError if the number belongs to another account.
 */
export function updatePhone(phone: string): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ phone }),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await apiFetch<{ user: AuthUser }>("/auth/me", { method: "GET" });
    return data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
