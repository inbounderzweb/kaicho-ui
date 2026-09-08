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
