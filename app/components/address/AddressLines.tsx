import type { OrderAddress } from "@/lib/api/order";

// One place that decides how an address reads on screen. Typed against
// OrderAddress (the snapshot shape stored on an order) rather than
// Address, because every field it renders is common to both — so the
// address book, the checkout selector and an order's shipping address all
// format identically instead of three near-copies drifting apart.
//
// Structured fields are preferred; `line1` / `line2` are the fallback for
// orders placed before those fields existed.
export default function AddressLines({
  address,
  className = "",
}: {
  address: OrderAddress;
  className?: string;
}) {
  const structured = Boolean(address.houseNo || address.area);

  const streetLine = structured
    ? [address.houseNo, address.building].filter(Boolean).join(", ")
    : address.line1;
  const areaLine = structured ? address.area : address.line2;

  return (
    <div className={`text-sm text-ink-muted ${className}`}>
      {(address.receiverName || address.receiverPhone) && (
        <p className="font-semibold text-ink">
          {address.receiverName}
          {address.receiverName && address.receiverPhone ? " · " : ""}
          {address.receiverPhone}
        </p>
      )}
      {streetLine && <p>{streetLine}</p>}
      {areaLine && <p>{areaLine}</p>}
      {address.landmark && <p>Landmark: {address.landmark}</p>}
      <p>
        {address.city}, {address.state} {address.pincode}
      </p>
    </div>
  );
}
