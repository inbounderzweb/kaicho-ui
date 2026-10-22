"use client";

import { useEffect, useRef, useState } from "react";
import NotifyClientCheckbox from "./NotifyClientCheckbox";

export interface EmailConsentModalProps {
  open: boolean;
  /** The verified address the email would go to. */
  customerEmail: string;
  /** Short lines describing the pending change, e.g. "Order status: Confirmed → Processing". */
  summary: string[];
  /** A request is in flight: every action is disabled and the modal can't be dismissed. */
  busy?: boolean;
  /** Save; `sendEmail` is the state of the checkbox (unticked by default). */
  onSave: (sendEmail: boolean) => void;
  /** Discard the pending update: nothing is saved and nothing is sent. */
  onCancel: () => void;
}

const FOCUSABLE = "button:not([disabled]), input:not([disabled])";

// Asks permission before saving a change that can email the client. The
// checkbox is the explicit consent, sent to the server as `sendEmail`; the
// server, not this UI, decides whether mail goes out, and only `true` sends it.
export default function EmailConsentModal({ open, customerEmail, summary, busy = false, onSave, onCancel }: EmailConsentModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(busy);
  const [sendEmail, setSendEmail] = useState(false);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  // Every time the modal opens the checkbox starts unticked.
  useEffect(() => {
    if (!open) return;
    const reset = setTimeout(() => setSendEmail(false), 0);
    return () => clearTimeout(reset);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    saveRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!busyRef.current) onCancel();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !busy && onCancel()} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-consent-title"
        aria-describedby="email-consent-desc"
        aria-busy={busy || undefined}
        className="relative w-full max-w-md rounded-2xl border border-admin-border bg-admin-card p-5 shadow-xl dark:border-admin-border-dark dark:bg-admin-card-dark"
      >
        <h2 id="email-consent-title" className="text-base font-bold text-black dark:text-white">
          Update Confirmation
        </h2>
        <p id="email-consent-desc" className="mt-2 text-sm text-black/60 dark:text-white/60">
          Your changes are ready to be saved. Tick the box below if you also want to notify the client by email.
        </p>

        {summary.length > 0 && (
          <ul className="mt-4 list-disc space-y-0.5 rounded-xl bg-admin-surface p-3 pl-7 text-sm font-semibold text-black dark:bg-admin-surface-dark dark:text-white">
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <NotifyClientCheckbox checked={sendEmail} onChange={setSendEmail} email={customerEmail} disabled={busy} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-admin-border px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-admin-border-dark"
          >
            Cancel
          </button>
          <button
            ref={saveRef}
            type="button"
            onClick={() => onSave(sendEmail)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-admin-primary px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy && <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
