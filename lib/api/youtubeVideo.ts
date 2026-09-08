import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

// Backed by kaicho-be's /api/admin/youtube-videos/* (requireAuth +
// requireRole("admin")). Admin-only; no public endpoint this phase.

export const YOUTUBE_VIDEO_TYPES = ["VIDEO", "SHORT"] as const;
export type YouTubeVideoType = (typeof YOUTUBE_VIDEO_TYPES)[number];

export const YOUTUBE_VIDEO_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type YouTubeVideoStatus = (typeof YOUTUBE_VIDEO_STATUSES)[number];

export interface YouTubeVideo {
  id: string;
  url: string;
  platform: "YOUTUBE";
  videoType: YouTubeVideoType;
  videoId: string;
  displayOrder: number;
  status: YouTubeVideoStatus;
  createdAt: string;
  updatedAt: string;
}

export type YouTubeVideoStatusFilter = "all" | YouTubeVideoStatus;

export interface YouTubeVideoQueryParams extends PageParams {
  search?: string;
  status?: YouTubeVideoStatusFilter;
}

export interface YouTubeVideoFormPayload {
  url: string;
  displayOrder?: number;
  status?: "ACTIVE" | "INACTIVE";
}

function buildQuery({ page = 1, pageSize = 20, search, status }: YouTubeVideoQueryParams): string {
  let qs = `?page=${page}&pageSize=${pageSize}`;
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  return qs;
}

export function fetchYouTubeVideos(
  params: YouTubeVideoQueryParams = {}
): Promise<Paginated<YouTubeVideo>> {
  return apiFetch<Paginated<YouTubeVideo>>(`/admin/youtube-videos${buildQuery(params)}`, { method: "GET" });
}

export function fetchYouTubeVideo(id: string): Promise<{ video: YouTubeVideo }> {
  return apiFetch<{ video: YouTubeVideo }>(`/admin/youtube-videos/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function createYouTubeVideo(payload: YouTubeVideoFormPayload): Promise<{ video: YouTubeVideo }> {
  return apiFetch<{ video: YouTubeVideo }>("/admin/youtube-videos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateYouTubeVideo(
  id: string,
  patch: Partial<YouTubeVideoFormPayload>
): Promise<{ video: YouTubeVideo }> {
  return apiFetch<{ video: YouTubeVideo }>(`/admin/youtube-videos/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function setYouTubeVideoStatus(
  id: string,
  status: YouTubeVideoStatus
): Promise<{ video: YouTubeVideo }> {
  return apiFetch<{ video: YouTubeVideo }>(
    `/admin/youtube-videos/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
}

export function deleteYouTubeVideo(id: string): Promise<void> {
  return apiFetch<void>(`/admin/youtube-videos/${encodeURIComponent(id)}`, { method: "DELETE" });
}
