import { IconMapPin } from "../ui/icons";
import { ADDRESSES } from "./profile-data";

export default function AddressesSection() {
  return (
    <div className="space-y-4">
      {ADDRESSES.map((address) => (
        <div
          key={address.id}
          className="flex items-start gap-4 rounded-2xl border border-border bg-white p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <IconMapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-ink">{address.label}</h3>
              {address.isDefault && (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-muted">{address.name}</p>
            <p className="text-sm text-ink-muted">{address.line}</p>
            <p className="mt-1 text-sm text-ink-muted">{address.phone}</p>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="w-full rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-ink-muted transition-colors hover:border-brand hover:text-brand"
      >
        + Add new address
      </button>
    </div>
  );
}
