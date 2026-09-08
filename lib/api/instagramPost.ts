import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

// Backed by kaicho-be's /api/admin/instagram-posts/* (requireAuth +
// requireRole("admin")). Admin-only; there is no public/customer endpoint
// for this phase.

export const INSTAGRAM_POST_TYPES = ["POST", "REEL"] as const;
export type InstagramPostType = (typeof INSTAGRAM_POST_TYPES)[number];

export const INSTAGRAM_POST_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type InstagramPostStatus = (typeof INSTAGRAM_POST_STATUSES)[number];

export interface InstagramPost {
  id: string;
  url: string;
  platform: "INSTAGRAM";
  postType: InstagramPostType;
  shortCode: string;
  displayOrder: number;
  status: InstagramPostStatus;
  createdAt: string;
  updatedAt: string;
}

export type InstagramPostStatusFilter = "all" | InstagramPostStatus;

export interface InstagramPostQueryParams extends PageParams {
  search?: string;
  status?: InstagramPostStatusFilter;
}

export interface InstagramPostFormPayload {
  url: string;
  displayOrder?: number;
  status?: "ACTIVE" | "INACTIVE";
}

function buildQuery({ page = 1, pageSize = 20, search, status }: InstagramPostQueryParams): string {
  let qs = `?page=${page}&pageSize=${pageSize}`;
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  return qs;
}

export function fetchInstagramPosts(
  params: InstagramPostQueryParams = {}
): Promise<Paginated<InstagramPost>> {
  return apiFetch<Paginated<InstagramPost>>(`/admin/instagram-posts${buildQuery(params)}`, {
    method: "GET",
  });
}

export function fetchInstagramPost(id: string): Promise<{ post: InstagramPost }> {
  return apiFetch<{ post: InstagramPost }>(`/admin/instagram-posts/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function createInstagramPost(
  payload: InstagramPostFormPayload
): Promise<{ post: InstagramPost }> {
  return apiFetch<{ post: InstagramPost }>("/admin/instagram-posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInstagramPost(
  id: string,
  patch: Partial<InstagramPostFormPayload>
): Promise<{ post: InstagramPost }> {
  return apiFetch<{ post: InstagramPost }>(`/admin/instagram-posts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function setInstagramPostStatus(
  id: string,
  status: InstagramPostStatus
): Promise<{ post: InstagramPost }> {
  return apiFetch<{ post: InstagramPost }>(
    `/admin/instagram-posts/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
}

export function deleteInstagramPost(id: string): Promise<void> {
  return apiFetch<void>(`/admin/instagram-posts/${encodeURIComponent(id)}`, { method: "DELETE" });
}
