import { apiFetch } from "./client";

// The two unauthenticated public form submissions. The response is only the
// generated inquiry number — no stored record is ever returned.

export interface BulkOrderSubmitInput {
  name: string;
  email: string;
  phone: string;
  quantity: number;
  purpose: string;
  message?: string;
}

export interface ContactSubmitInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export function submitBulkOrderInquiry(input: BulkOrderSubmitInput): Promise<{ inquiryNumber: string }> {
  return apiFetch<{ inquiryNumber: string }>("/inquiries/bulk-order", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitContactInquiry(input: ContactSubmitInput): Promise<{ inquiryNumber: string }> {
  return apiFetch<{ inquiryNumber: string }>("/inquiries/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
