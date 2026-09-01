import {
  SHIPMENT_TIMELINE_STEPS,
  SHIPMENT_STATUS_LABELS,
  shipmentProgress,
  type OrderShipment,
} from "@/lib/api/order";

// Vertical stepper on mobile, horizontal on sm+. Driven entirely by
// `shipmentProgress` so the "furthest reached" step and the exception states
// stay consistent with the badge shown elsewhere on the page.
export default function ShipmentTimeline({ shipment }: { shipment: OrderShipment }) {
  const { stepIndex, state } = shipmentProgress(shipment);

  if (state === "exception") {
    return (
      <div className="rounded-xl bg-sale/10 p-4 text-sm font-semibold text-sale">
        {shipment.status === "FAILED_DELIVERY"
          ? "A delivery attempt failed — the courier will try again shortly."
          : "This shipment was cancelled."}
      </div>
    );
  }

  const lastIndex = SHIPMENT_TIMELINE_STEPS.length - 1;

  return (
    <ol className="sm:flex sm:items-start">
      {SHIPMENT_TIMELINE_STEPS.map((step, i) => {
        const done = i <= stepIndex;
        const current = i === stepIndex;
        return (
          <li
            key={step}
            className="relative flex gap-3 pb-6 last:pb-0 sm:flex-1 sm:flex-col sm:gap-2 sm:pb-0"
          >
            {i < lastIndex && (
              <span
                aria-hidden
                className={`absolute left-[5px] top-4 h-full w-px sm:left-auto sm:right-0 sm:top-[5px] sm:h-px sm:w-full ${
                  i < stepIndex ? "bg-brand" : "bg-border"
                }`}
              />
            )}
            <span
              className={`relative z-10 mt-0.5 h-3 w-3 shrink-0 rounded-full sm:mt-0 ${
                current
                  ? "bg-brand ring-4 ring-brand/20"
                  : done
                    ? "bg-brand"
                    : "bg-border"
              }`}
            />
            <span
              className={`text-xs font-semibold sm:mt-1 ${done ? "text-ink" : "text-ink-faint"}`}
            >
              {SHIPMENT_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
