import { ApiError } from "./ApiError";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

// The backend's origin, without the /api suffix — for resolving the
// root-relative asset URLs it returns (e.g. "/uploads/media/..."), which
// are only valid against the backend's own origin, not wherever the
// frontend happens to be served from.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let body: ApiResponse<T> | undefined;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  if (!res.ok) {
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", res.status, body?.details);
  }

  return (body?.data as T) ?? (undefined as T);
}
