import {
  INQUIRY_STATUS_LABELS,
  INQUIRY_FORM_TYPE_LABELS,
  type InquiryStatus,
  type InquiryFormType,
} from "@/lib/api/inquiry";

// Same pill shape + semantic colour vocabulary as OrderStatusBadge, so the
// admin reads as one system.
const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
const fallback = "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70";

const STATUS_STYLES: Record<InquiryStatus, string> = {
  NEW: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  CONTACTED: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  QUOTED: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  NEGOTIATING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  CONVERTED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  CLOSED: "bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60",
  NOT_INTERESTED: "bg-red-500/15 text-red-700 dark:text-red-400",
  INVALID: "bg-red-500/15 text-red-700 dark:text-red-400",
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`${base} ${STATUS_STYLES[status] ?? fallback}`}>
      {INQUIRY_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const FORM_TYPE_STYLES: Record<InquiryFormType, string> = {
  bulk_order: "bg-brand/15 text-brand-dark dark:text-admin-primary",
  contact: "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70",
};

export function InquiryFormTypeBadge({ formType }: { formType: InquiryFormType }) {
  return (
    <span className={`${base} ${FORM_TYPE_STYLES[formType] ?? fallback}`}>
      {INQUIRY_FORM_TYPE_LABELS[formType] ?? formType}
    </span>
  );
}
