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
  /** How many entities currently reference this asset (spec §10). */
  usageCount: number;
  createdAt: string;
}

export interface MediaUsageInfo {
  entityType: string;
  entityId: string;
  field: string;
  label: string;
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
  /** True when the upload matched an existing asset by content hash and no
   *  new file was stored — the caller got back the pre-existing asset. */
  deduped?: boolean;
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
  mimeType?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
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
  mimeType,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  sort,
  order,
  ...pageParams
}: MediaQueryParams = {}): Promise<Paginated<AdminMedia>> {
  let qs = query(pageParams);
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  if (mediaType && mediaType !== "all") qs += `&mediaType=${mediaType}`;
  if (mimeType) qs += `&mimeType=${encodeURIComponent(mimeType)}`;
  if (minWidth) qs += `&minWidth=${minWidth}`;
  if (maxWidth) qs += `&maxWidth=${maxWidth}`;
  if (minHeight) qs += `&minHeight=${minHeight}`;
  if (maxHeight) qs += `&maxHeight=${maxHeight}`;
  if (sort) qs += `&sort=${sort}`;
  if (order) qs += `&order=${order}`;
  return apiFetch<Paginated<AdminMedia>>(`/admin/media${qs}`, { method: "GET" });
}

export function fetchMediaUsages(id: string): Promise<{ usages: MediaUsageInfo[] }> {
  return apiFetch<{ usages: MediaUsageInfo[] }>(
    `/admin/media/${encodeURIComponent(id)}/usages`,
    { method: "GET" }
  );
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

// Uploads run in the browser (XHR, for progress events), so — like apiFetch —
// they go through the frontend's own origin and the next.config.ts proxy
// rewrite, never straight to the backend / dev tunnel.
const API_BASE_URL = "/api";

interface UploadResponseBody {
  success?: boolean;
  message?: string;
  data?: UploadedMedia[];
  errors?: UploadMediaError[];
}

// Hosting proxies cap request bodies (Vercel's is ~4.5MB), and a request over
// the cap is rejected with an HTML 413 before our API ever sees it — which
// used to surface as a generic "Upload failed" when several photos were picked
// at once. Files are therefore sent in small sequential batches, and a failed
// batch only fails its own files.
const MAX_BATCH_BYTES = 3.5 * 1024 * 1024;
const MAX_BATCH_FILES = 10; // matches the backend's MAX_MEDIA_FILES_PER_REQUEST default
const UPLOAD_TIMEOUT_MS = 120_000;

function describeUploadFailure(status: number, body: UploadResponseBody | undefined): string {
  if (status === 401 || status === 403) return "Your session has expired. Please sign in again and retry.";
  if (status === 413) return "The file is too large for the server. Try a smaller or compressed image.";
  if (status === 429) return "Too many uploads in a short time. Please wait a minute and try again.";
  if (body?.message) return body.message;
  if (status >= 500) return `The server couldn't process the upload (error ${status}). Please try again.`;
  return "Upload failed. Please try again.";
}

// Plain fetch/apiFetch has no upload-progress API — XMLHttpRequest is the
// only way to observe bytes-sent for a real progress bar.
function uploadBatch(
  files: File[],
  onProgress?: (fraction: number) => void
): Promise<UploadMediaResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/admin/media/upload`);
    xhr.withCredentials = true;
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
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
      reject(new ApiError(describeUploadFailure(xhr.status, body), xhr.status));
    };

    xhr.onerror = () =>
      reject(new ApiError("Network error during upload. Check your connection and try again.", 0));
    xhr.ontimeout = () =>
      reject(new ApiError("The upload timed out. Try fewer or smaller images.", 0));
    xhr.send(formData);
  });
}

function toBatches(files: File[]): File[][] {
  const batches: File[][] = [];
  let current: File[] = [];
  let currentBytes = 0;
  for (const file of files) {
    if (current.length > 0 && (currentBytes + file.size > MAX_BATCH_BYTES || current.length >= MAX_BATCH_FILES)) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(file);
    currentBytes += file.size;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

export async function uploadMedia(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<UploadMediaResult> {
  const batches = toBatches(files);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0) || 1;
  const result: UploadMediaResult = { data: [], errors: [] };
  let sentBytes = 0;
  let transportError: ApiError | null = null;
  let requestsOk = 0;

  const report = (loadedInCurrent: number) =>
    onProgress?.(Math.min(100, Math.round(((sentBytes + loadedInCurrent) / totalBytes) * 100)));

  // One request. Returns false on a hard failure (recorded as per-file errors).
  const send = async (group: File[]): Promise<"ok" | "rejected" | "fatal"> => {
    const groupBytes = group.reduce((sum, f) => sum + f.size, 0);
    try {
      const res = await uploadBatch(group, (fraction) => report(fraction * groupBytes));
      result.data.push(...res.data);
      result.errors.push(...res.errors);
      requestsOk++;
      return "ok";
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("Upload failed. Please try again.", 0);
      // An expired session fails every remaining request the same way — stop.
      if (apiErr.status === 401 || apiErr.status === 403) throw apiErr;
      transportError = apiErr;
      // 400/413 = the server refused this whole request (e.g. one file over a
      // hard cap makes multer/the proxy reject the lot). Not a per-file verdict
      // yet, so the caller may isolate the culprit.
      if (group.length > 1 && (apiErr.status === 400 || apiErr.status === 413)) return "rejected";
      for (const file of group) result.errors.push({ originalName: file.name, message: apiErr.message });
      return "fatal";
    }
  };

  for (const batch of batches) {
    const outcome = await send(batch);
    if (outcome === "rejected") {
      // Re-send one file at a time so a single bad file can't sink its
      // batch-mates; each gets its own precise verdict.
      for (const file of batch) {
        await send([file]);
        sentBytes += file.size;
        report(0);
      }
    } else {
      sentBytes += batch.reduce((sum, f) => sum + f.size, 0);
      report(0);
    }
  }

  // No request got through at all (network down, proxy/server error): reject so
  // callers show the real reason. Per-file rejections from the server stay in
  // `errors` with their file names.
  if (requestsOk === 0 && transportError) throw transportError;
  return result;
}
