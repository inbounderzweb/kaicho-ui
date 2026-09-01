"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInquiryDetail, useInquiryAssignees } from "@/lib/hooks/admin/useInquiries";
import {
  useUpdateInquiry,
  useChangeInquiryStatus,
  useAssignInquiry,
  useAddInquiryNote,
  useDeleteInquiry,
} from "@/lib/hooks/admin/useInquiryMutations";
import { ApiError } from "@/lib/api/ApiError";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  INQUIRY_FORM_TYPE_LABELS,
  type AdminInquiryDetail,
  type InquiryActivityItem,
  type InquiryStatus,
} from "@/lib/api/inquiry";
import ConfirmDialog from "./ConfirmDialog";
import { InquiryStatusBadge } from "./InquiryStatusBadge";
import { IconChevronLeft } from "../ui/icons";

const card =
  "space-y-3 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";
const sectionTitle =
  "font-display text-sm font-bold uppercase tracking-wide text-black/70 dark:text-white/70";
const inputClass =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className={labelClass}>{label}</dt>
      <dd className="text-sm text-black dark:text-white">{children}</dd>
    </div>
  );
}

function activityText(a: InquiryActivityItem): string {
  switch (a.action) {
    case "CREATED":
      return "Inquiry submitted";
    case "STATUS_CHANGED":
      return `Status changed: ${INQUIRY_STATUS_LABELS[a.oldValue as InquiryStatus] ?? a.oldValue} → ${
        INQUIRY_STATUS_LABELS[a.newValue as InquiryStatus] ?? a.newValue
      }`;
    case "ASSIGNED":
      return `Assigned to: ${a.newValue ?? "Unassigned"}`;
    case "NOTE_ADDED":
      return "Internal note added";
    case "UPDATED":
      return "Details edited";
    default:
      return a.action;
  }
}

type EditForm = {
  name: string;
  email: string;
  phone: string;
  quantity: string;
  purpose: string;
  message: string;
};

function toEditForm(inq: AdminInquiryDetail): EditForm {
  return {
    name: inq.name,
    email: inq.email,
    phone: inq.phone ?? "",
    quantity: inq.quantity != null ? String(inq.quantity) : "",
    purpose: inq.purpose ?? "",
    message: inq.message ?? "",
  };
}

export default function InquiryDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useInquiryDetail(id);
  const inquiry = data?.inquiry;
  const { data: assignees } = useInquiryAssignees();

  const updateMutation = useUpdateInquiry(id);
  const statusMutation = useChangeInquiryStatus(id);
  const assignMutation = useAssignInquiry(id);
  const noteMutation = useAddInquiryNote(id);
  const deleteMutation = useDeleteInquiry();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingStatus, setPendingStatus] = useState<InquiryStatus | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Deferred set — same pattern the blog/category editors use to satisfy
  // react-hooks/set-state-in-effect. Keeps the edit form in step with fetched
  // data whenever we're not mid-edit.
  useEffect(() => {
    if (!inquiry || editing) return;
    const t = setTimeout(() => setForm(toEditForm(inquiry)), 0);
    return () => clearTimeout(t);
  }, [inquiry, editing]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isError || !inquiry) {
    const st = error instanceof ApiError ? error.status : 0;
    return (
      <div className={`${card} items-start`}>
        <p className="text-sm font-semibold">
          {st === 404 ? "This inquiry doesn't exist, or has been deleted." : "Couldn't load this inquiry."}
        </p>
        <div className="flex gap-2">
          {st !== 404 && (
            <button type="button" onClick={() => refetch()} className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90">
              Retry
            </button>
          )}
          <Link href="/admin/inquiries" className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark">
            Back to Inquiries
          </Link>
        </div>
      </div>
    );
  }

  const isBulk = inquiry.formType === "bulk_order";
  const busy = updateMutation.isPending || statusMutation.isPending || assignMutation.isPending;

  const flash = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const saveEdit = () => {
    if (!form) return;
    setActionError(null);
    const patch: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
    };
    if (isBulk) {
      patch.purpose = form.purpose.trim();
      if (form.quantity.trim()) patch.quantity = Number(form.quantity);
    }
    updateMutation.mutate(patch, {
      onSuccess: () => {
        setEditing(false);
        flash();
      },
      onError: (err) => setActionError(err instanceof ApiError ? err.message : "Couldn't save changes."),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
          <IconChevronLeft className="h-4 w-4" />
          Inquiries
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-mono font-semibold">{inquiry.inquiryNumber}</span>
        <InquiryStatusBadge status={inquiry.status} />
      </div>

      {actionError && (
        <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{actionError}</p>
      )}
      {savedFlash && (
        <p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Saved.</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: customer + inquiry info + activity */}
        <div className="space-y-6 lg:col-span-2">
          <section className={card}>
            <div className="flex items-center justify-between">
              <h2 className={sectionTitle}>Customer information</h2>
              {!editing ? (
                <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white">
                  Edit details
                </button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={saveEdit} disabled={busy} className="rounded-full bg-admin-primary px-3 py-1 text-xs font-semibold text-black disabled:opacity-50">
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setForm(toEditForm(inquiry)); }} className="rounded-full border border-admin-border px-3 py-1 text-xs font-semibold dark:border-admin-border-dark">
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {editing && form ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1"><span className={labelClass}>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></label>
                <label className="space-y-1"><span className={labelClass}>Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></label>
                <label className="space-y-1"><span className={labelClass}>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></label>
              </div>
            ) : (
              <dl className="space-y-2.5">
                <Row label="Name">{inquiry.name}</Row>
                <Row label="Email"><a href={`mailto:${inquiry.email}`} className="text-admin-primary-dark hover:underline dark:text-admin-primary">{inquiry.email}</a></Row>
                <Row label="Phone">{inquiry.phone ? <a href={`tel:${inquiry.phone}`} className="text-admin-primary-dark hover:underline dark:text-admin-primary">{inquiry.phone}</a> : "—"}</Row>
              </dl>
            )}
          </section>

          <section className={card}>
            <h2 className={sectionTitle}>Inquiry information</h2>
            {editing && form ? (
              <div className="space-y-3">
                {isBulk && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="space-y-1"><span className={labelClass}>Quantity</span><input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} /></label>
                    <label className="space-y-1"><span className={labelClass}>Purpose</span><input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} /></label>
                  </div>
                )}
                <label className="block space-y-1"><span className={labelClass}>Message</span><textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputClass} /></label>
              </div>
            ) : (
              <dl className="space-y-2.5">
                <Row label="Form type">{INQUIRY_FORM_TYPE_LABELS[inquiry.formType]}</Row>
                {isBulk && <Row label="Quantity">{inquiry.quantity != null ? inquiry.quantity.toLocaleString("en-IN") : "—"}</Row>}
                {isBulk && <Row label="Purpose">{inquiry.purpose ?? "—"}</Row>}
                <Row label="Message">
                  <span className="whitespace-pre-wrap">{inquiry.message ?? "—"}</span>
                </Row>
                <Row label="Submitted">{fmtDateTime(inquiry.createdAt)}</Row>
              </dl>
            )}
          </section>

          <section className={card}>
            <h2 className={sectionTitle}>Activity &amp; history</h2>
            <ol className="space-y-3">
              {inquiry.activity.map((a) => (
                <li key={a.activityId} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-admin-primary-dark dark:bg-admin-primary" />
                  <div>
                    <p className="text-xs text-black/45 dark:text-white/45">{fmtDateTime(a.createdAt)}</p>
                    <p className="text-black/80 dark:text-white/80">
                      {activityText(a)}
                      {a.userName && <span className="text-black/45 dark:text-white/45"> · by {a.userName}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right: management */}
        <div className="space-y-6">
          <section className={card}>
            <h2 className={sectionTitle}>Management</h2>

            <div className="space-y-1.5">
              <label className={labelClass}>Status</label>
              <select
                value={inquiry.status}
                disabled={statusMutation.isPending}
                onChange={(e) => setPendingStatus(e.target.value as InquiryStatus)}
                className={inputClass}
              >
                {INQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {INQUIRY_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Assigned to</label>
              <select
                value={inquiry.assignedTo?.userId ?? ""}
                disabled={assignMutation.isPending}
                onChange={(e) => {
                  setActionError(null);
                  assignMutation.mutate(e.target.value || null, {
                    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Couldn't update assignment."),
                  });
                }}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {(assignees ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className={card}>
            <h2 className={sectionTitle}>Internal notes</h2>
            <p className="text-[11px] text-black/45 dark:text-white/45">Only visible to admins — never shown to the customer.</p>
            <div className="space-y-2">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Add a note…"
                className={inputClass}
              />
              <button
                type="button"
                disabled={!noteDraft.trim() || noteMutation.isPending}
                onClick={() =>
                  noteMutation.mutate(noteDraft.trim(), {
                    onSuccess: () => setNoteDraft(""),
                    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Couldn't add the note."),
                  })
                }
                className="w-full rounded-full bg-admin-primary px-4 py-2 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
              >
                {noteMutation.isPending ? "Adding…" : "Add note"}
              </button>
            </div>
            <ul className="space-y-3 border-t border-admin-border pt-3 dark:border-admin-border-dark">
              {inquiry.notes.length === 0 ? (
                <li className="text-xs text-black/45 dark:text-white/45">No notes yet.</li>
              ) : (
                inquiry.notes.map((n) => (
                  <li key={n.noteId} className="text-sm">
                    <p className="text-xs text-black/45 dark:text-white/45">
                      {n.userName} · {fmtDateTime(n.createdAt)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-black/80 dark:text-white/80">{n.note}</p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="w-full rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            Delete inquiry
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingStatus !== null && pendingStatus !== inquiry.status}
        title="Change status?"
        description={`Move ${inquiry.inquiryNumber} from ${INQUIRY_STATUS_LABELS[inquiry.status]} to ${
          pendingStatus ? INQUIRY_STATUS_LABELS[pendingStatus] : ""
        }?`}
        confirmLabel="Change status"
        isConfirming={statusMutation.isPending}
        onConfirm={() => {
          if (!pendingStatus) return;
          setActionError(null);
          statusMutation.mutate(pendingStatus, {
            onSuccess: () => setPendingStatus(null),
            onError: (err) => {
              setPendingStatus(null);
              setActionError(err instanceof ApiError ? err.message : "Couldn't change the status.");
            },
          });
        }}
        onCancel={() => setPendingStatus(null)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this inquiry?"
        description={`${inquiry.inquiryNumber} and its notes and activity history will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(id, {
            onSuccess: () => router.push("/admin/inquiries"),
            onError: (err) => {
              setDeleteOpen(false);
              setActionError(err instanceof ApiError ? err.message : "Couldn't delete the inquiry.");
            },
          })
        }
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
