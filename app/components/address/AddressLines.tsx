import type { OrderAddress } from "@/lib/api/order";

// One place that decides how an address reads on screen. Typed against
// OrderAddress (the snapshot shape stored on an order) rather than
// Address, because every field it renders is common to both — so the
// address book, the checkout selector and an order's shipping address all
// format identically instead of three near-copies drifting apart.
export default function AddressLines({
  address,
  className = "",
}: {
  address: OrderAddress;
  className?: string;
}) {
  return (
    <div className={`text-sm text-ink-muted ${className}`}>
      <p>{address.line1}</p>
      {address.line2 && <p>{address.line2}</p>}
      <p>
        {address.city}, {address.state} {address.pincode}
      </p>
    </div>
  );
}
