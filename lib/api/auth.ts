import { apiFetch } from "./client";
import { ApiError } from "./ApiError";
import type { UserRole } from "../constants/roles";

export type { UserRole };

export interface AuthUser {
  id: string;
  phone: string;
  countryCode: string;
  phoneVerified: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
}

export function sendOtp(phone: string): Promise<void> {
  return apiFetch<void>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
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

export function updateName(name: string): Promise<{ user: AuthUser }> {
  return apiFetch<{ user: AuthUser }>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
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
