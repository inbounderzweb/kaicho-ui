import { apiFetch } from "./client";
import type { PageParams, Paginated } from "./admin";

// Admin inquiry management client. Inquiries are addressed by Mongo _id.
// There is no public read client — only the two submit endpoints
// (inquiryPublic.ts).

export const INQUIRY_FORM_TYPES = ["bulk_order", "contact"] as const;
export type InquiryFormType = (typeof INQUIRY_FORM_TYPES)[number];

export const INQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "NEGOTIATING",
  "CONVERTED",
  "CLOSED",
  "NOT_INTERESTED",
  "INVALID",
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUOTED: "Quoted",
  NEGOTIATING: "Negotiating",
  CONVERTED: "Converted",
  CLOSED: "Closed",
  NOT_INTERESTED: "Not Interested",
  INVALID: "Invalid",
};

export const INQUIRY_FORM_TYPE_LABELS: Record<InquiryFormType, string> = {
  bulk_order: "Bulk Order",
  contact: "Contact",
};

export type InquiryAction = "CREATED" | "STATUS_CHANGED" | "ASSIGNED" | "NOTE_ADDED" | "UPDATED";

export interface InquiryAssigneeRef {
  userId: string;
  name: string;
}

export interface AdminInquiryListItem {
  inquiryId: string;
  inquiryNumber: string;
  formType: InquiryFormType;
  name: string;
  email: string;
  phone: string | null;
  quantity: number | null;
  purpose: string | null;
  status: InquiryStatus;
  assignedTo: InquiryAssigneeRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryNote {
  noteId: string;
  note: string;
  userName: string;
  createdAt: string;
}

export interface InquiryActivityItem {
  activityId: string;
  action: InquiryAction;
  oldValue: string | null;
  newValue: string | null;
  userName: string | null;
  createdAt: string;
}

export interface AdminInquiryDetail {
  inquiryId: string;
  inquiryNumber: string;
  formType: InquiryFormType;
  name: string;
  email: string;
  phone: string | null;
  quantity: number | null;
  purpose: string | null;
  message: string | null;
  status: InquiryStatus;
  assignedTo: InquiryAssigneeRef | null;
  createdAt: string;
  updatedAt: string;
  notes: InquiryNote[];
  activity: InquiryActivityItem[];
}

export interface InquiryStats {
  total: number;
  byStatus: Record<InquiryStatus, number>;
}

export type InquirySortOption = "newest" | "oldest" | "updated" | "name";

export interface AdminInquiryQueryParams extends PageParams {
  formType?: InquiryFormType | "all";
  status?: InquiryStatus | "all";
  assignedTo?: string; // user id, or "unassigned"
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: InquirySortOption;
}

export interface InquiryUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  quantity?: number;
  purpose?: string;
  message?: string;
  status?: InquiryStatus;
  assignedTo?: string | null;
}

function buildQuery(params: AdminInquiryQueryParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  if (params.formType && params.formType !== "all") qs.set("formType", params.formType);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.assignedTo) qs.set("assignedTo", params.assignedTo);
  if (params.search) qs.set("search", params.search);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  if (params.sort) qs.set("sort", params.sort);
  return `?${qs.toString()}`;
}

export function fetchInquiries(params: AdminInquiryQueryParams = {}): Promise<Paginated<AdminInquiryListItem>> {
  return apiFetch<Paginated<AdminInquiryListItem>>(`/admin/inquiries${buildQuery(params)}`, { method: "GET" });
}

export function fetchInquiryStats(): Promise<InquiryStats> {
  return apiFetch<InquiryStats>("/admin/inquiries/stats", { method: "GET" });
}

export function fetchInquiryAssignees(): Promise<{ id: string; name: string }[]> {
  return apiFetch<{ id: string; name: string }[]>("/admin/inquiries/assignees", { method: "GET" });
}

export function fetchInquiryDetail(id: string): Promise<{ inquiry: AdminInquiryDetail }> {
  return apiFetch<{ inquiry: AdminInquiryDetail }>(`/admin/inquiries/${encodeURIComponent(id)}`, { method: "GET" });
}

export function updateInquiry(id: string, patch: InquiryUpdateInput): Promise<{ inquiry: AdminInquiryDetail }> {
  return apiFetch<{ inquiry: AdminInquiryDetail }>(`/admin/inquiries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function changeInquiryStatus(id: string, status: InquiryStatus): Promise<{ inquiry: AdminInquiryDetail }> {
  return apiFetch<{ inquiry: AdminInquiryDetail }>(`/admin/inquiries/${encodeURIComponent(id)}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export function assignInquiry(id: string, assignedTo: string | null): Promise<{ inquiry: AdminInquiryDetail }> {
  return apiFetch<{ inquiry: AdminInquiryDetail }>(`/admin/inquiries/${encodeURIComponent(id)}/assign`, {
    method: "POST",
    body: JSON.stringify({ assignedTo }),
  });
}

export function addInquiryNote(id: string, note: string): Promise<{ inquiry: AdminInquiryDetail }> {
  return apiFetch<{ inquiry: AdminInquiryDetail }>(`/admin/inquiries/${encodeURIComponent(id)}/notes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export function deleteInquiry(id: string): Promise<void> {
  return apiFetch<void>(`/admin/inquiries/${encodeURIComponent(id)}`, { method: "DELETE" });
}
