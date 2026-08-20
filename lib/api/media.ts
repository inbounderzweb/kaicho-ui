import { apiFetch } from "./client";
import { ApiError } from "./ApiError";
import type { PageParams, Paginated } from "./admin";

export type MediaKind = "IMAGE" | "DOCUMENT";
export type MediaStatus = "TEMPORARY" | "ATTACHED";

export interface AdminMedia {
  mediaId: string;
  mediaType: MediaKind;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  pageCount?: number;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  status: MediaStatus;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface UploadedMedia {
  mediaId: string;
  mediaType: MediaKind;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  pageCount?: number;
  status: MediaStatus;
}

export interface UploadMediaError {
  originalName: string;
  message: string;
}

export interface UploadMediaResult {
  data: UploadedMedia[];
  errors: UploadMediaError[];
}

export interface MediaQueryParams extends PageParams {
  search?: string;
  status?: "all" | MediaStatus;
  mediaType?: "all" | MediaKind;
  sort?: "createdAt" | "size" | "originalName";
  order?: "asc" | "desc";
}

export interface UpdateMediaInput {
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

function query({ page = 1, pageSize = 24 }: PageParams): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

export function fetchMediaList({
  search,
  status,
  mediaType,
  sort,
  order,
  ...pageParams
}: MediaQueryParams = {}): Promise<Paginated<AdminMedia>> {
  let qs = query(pageParams);
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  if (mediaType && mediaType !== "all") qs += `&mediaType=${mediaType}`;
  if (sort) qs += `&sort=${sort}`;
  if (order) qs += `&order=${order}`;
  return apiFetch<Paginated<AdminMedia>>(`/admin/media${qs}`, { method: "GET" });
}

export function fetchMediaDetail(id: string): Promise<{ media: AdminMedia }> {
  return apiFetch<{ media: AdminMedia }>(`/admin/media/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export function updateMedia(id: string, patch: UpdateMediaInput): Promise<{ media: AdminMedia }> {
  return apiFetch<{ media: AdminMedia }>(`/admin/media/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteMedia(id: string): Promise<void> {
  return apiFetch<void>(`/admin/media/${encodeURIComponent(id)}`, { method: "DELETE" });
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

interface UploadResponseBody {
  success?: boolean;
  message?: string;
  data?: UploadedMedia[];
  errors?: UploadMediaError[];
}

// Plain fetch/apiFetch has no upload-progress API — XMLHttpRequest is the
// only way to observe bytes-sent for a real progress bar.
export function uploadMedia(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<UploadMediaResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/admin/media/upload`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: UploadResponseBody | undefined;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = undefined;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ data: body?.data ?? [], errors: body?.errors ?? [] });
        return;
      }
      // A 400 with a structured `errors` array means "some/all files were
      // individually rejected" — a partial result, not a hard failure.
      if (xhr.status === 400 && body?.errors) {
        resolve({ data: body.data ?? [], errors: body.errors });
        return;
      }
      reject(new ApiError(body?.message ?? "Upload failed. Please try again.", xhr.status));
    };

    xhr.onerror = () => reject(new ApiError("Network error during upload.", 0));
    xhr.send(formData);
  });
}
