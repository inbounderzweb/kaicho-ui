"use client";

// Small opt-in beside a save button: ticked = the save also emails the client.
// Unticked by default. The choice is sent to the server as an explicit
// `sendEmail` flag; only a literal `true` sends mail.
export default function NotifyClientCheckbox({
  checked,
  onChange,
  email,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  email: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs text-black/65 dark:text-white/65">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-admin-primary-dark"
      />
      <span>
        <span className="font-semibold">Send email notification to client</span>
        <span className="block break-all text-[11px] text-black/45 dark:text-white/45">{email}</span>
      </span>
    </label>
  );
}
