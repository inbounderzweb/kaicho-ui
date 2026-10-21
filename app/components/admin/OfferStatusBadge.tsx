import type { OfferStatus } from "@/lib/api/offer";

// Same colour vocabulary as CouponStatusBadge / OrderStatusBadge. Renders the
// *effective* status — an ACTIVE offer past its end date shows EXPIRED.
const STYLES: Record<OfferStatus, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  SCHEDULED: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  DRAFT: "bg-black/10 text-black/60 dark:bg-white/10 dark:text-white/60",
  DISABLED: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  EXPIRED: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const LABELS: Record<OfferStatus, string> = {
  ACTIVE: "Active",
  SCHEDULED: "Scheduled",
  DRAFT: "Draft",
  DISABLED: "Disabled",
  EXPIRED: "Expired",
};

export default function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? STYLES.DRAFT}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
