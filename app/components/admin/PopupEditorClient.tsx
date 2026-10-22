"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePopupDetail, useCreatePopup, useUpdatePopup, useSetPopupStatus } from "@/lib/hooks/admin/usePopups";
import { setPopupStatus, type PopupDevice, type PopupStatus } from "@/lib/api/popup";
import { popupKeys } from "@/lib/hooks/query-keys";
import { ApiError } from "@/lib/api/ApiError";
import { popupFormSchema, type PopupFormValues } from "@/lib/validation/popup.schema";
import { defaultPopupForm, popupToFormValues, formValuesToPayload, normalizeForSubmit, runtimeFromForm } from "@/lib/popup/form";
import { describeVisibleDuration } from "@/lib/popup/timing";
import { POPUP_LIMITS as L } from "@/lib/popup/limits";
import PopupStatusBadge from "./PopupStatusBadge";
import BannerImageField from "./popup/BannerImageField";
import DesktopPlacementField from "./popup/DesktopPlacementField";
import PopupPreview, { type PopupPreviewHandle } from "./popup/PopupPreview";
import { OpenCloseTimingFields, CloseControlFields, PerDeviceNote } from "./popup/TimingFields";
import { CARD, ERR, FIELD, HINT, LABEL, NumberField, SelectField, TextField, ToggleField, errorAt } from "./popup/fields";
import { IconChevronLeft } from "../ui/icons";

const TABS = [
  { id: "general", label: "General" },
  { id: "content", label: "Content & Design" },
  { id: "desktop", label: "Desktop" },
  { id: "mobile", label: "Mobile" },
  { id: "triggers", label: "Triggers & Display Timing" },
  { id: "close", label: "Close Button & Dismissal" },
  { id: "schedule", label: "Schedule" },
  { id: "analytics", label: "Analytics" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function tabForPath(path: string): TabId {
  if (path.startsWith("content") || path.startsWith("design") || path.startsWith("countdown")) return "content";
  if (path.startsWith("devices.desktop") || path.startsWith("timing.desktop")) return "desktop";
  if (path.startsWith("devices.mobile") || path.startsWith("timing.mobile")) return "mobile";
  if (path.startsWith("schedule")) return "schedule";
  if (
    /^display\.(allowEarlyDismiss|closeButton|dismissal)/.test(path) ||
    /^timing\.shared\.(closeButton|backdrop|escape)/.test(path)
  ) {
    return "close";
  }
  if (path.startsWith("timing") || path.startsWith("display") || path.startsWith("targeting")) return "triggers";
  return "general";
}

function flattenPaths(errors: FieldErrors, prefix = ""): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "message" in value && typeof value.message === "string") out.push(path);
    else if (value && typeof value === "object") out.push(...flattenPaths(value as FieldErrors, path));
  }
  return out;
}

const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const errMessage = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

type SaveMode = "save" | "publish" | "draft";

export default function PopupEditorClient({ id }: { id?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const effectiveId = id ?? createdId ?? undefined;
  const isEdit = Boolean(effectiveId);

  const { data, isLoading, isError, error, refetch } = usePopupDetail(effectiveId ?? null);
  const createMutation = useCreatePopup();
  const updateMutation = useUpdatePopup(effectiveId ?? "");
  const statusMutation = useSetPopupStatus(effectiveId ?? "");

  const popup = data?.popup;
  const status: PopupStatus | "NEW" = popup?.status ?? "NEW";
  const readOnly = status === "ARCHIVED";

  const methods = useForm<PopupFormValues>({
    resolver: zodResolver(popupFormSchema),
    defaultValues: defaultPopupForm(),
    mode: "onSubmit",
  });
  const { handleSubmit, reset, setValue, getValues, control, formState } = methods;

  useEffect(() => {
    if (popup) reset(popupToFormValues(popup));
  }, [popup, reset]);

  const values = useWatch({ control }) as PopupFormValues;
  const [tab, setTab] = useState<TabId>("general");
  const [previewDevice, setPreviewDevice] = useState<PopupDevice>("desktop");
  const previewRef = useRef<PopupPreviewHandle>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const [banner, setBanner] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [countdownNonce, setCountdownNonce] = useState(0);

  const useShared = values.timing?.useSharedTimingSettings ?? true;

  const errorTabs = useMemo(
    () => new Set(flattenPaths(formState.errors).map(tabForPath)),
    [formState.errors]
  );

  // ---- toggles with side effects ----

  const onSharedToggle = (checked: boolean) => {
    const t = getValues("timing");
    if (checked) {
      setValue("timing.shared", { ...t.desktop });
    } else {
      setValue("timing.desktop", { ...t.shared });
      setValue("timing.mobile", { ...t.shared });
    }
  };

  const onAllowEarlyToggle = (allow: boolean) => {
    if (allow) return;
    // Early dismissal off → auto-close is mandatory and capped, on every set.
    for (const key of ["shared", "desktop", "mobile"] as const) {
      setValue(`timing.${key}.autoCloseEnabled`, true);
      const cur = Number(getValues(`timing.${key}.autoCloseAfterSeconds`));
      setValue(`timing.${key}.autoCloseAfterSeconds`, Math.min(Number.isFinite(cur) ? cur : 10, L.earlyDismissLockMaxSeconds));
    }
  };

  // ---- save / publish ----

  const run = async (mode: SaveMode) => {
    setBanner(null);
    const normalized = normalizeForSubmit(getValues());
    setValue("timing", normalized.timing);
    await handleSubmit(async (v) => {
      const payload = formValuesToPayload(normalizeForSubmit(v));
      setBusy(true);
      try {
        let popupId = effectiveId;
        if (!popupId) {
          const res = await createMutation.mutateAsync(payload);
          popupId = res.popup.id;
          setCreatedId(popupId);
        } else {
          await updateMutation.mutateAsync(payload);
        }
        if (mode === "publish" && status !== "PUBLISHED") {
          await setPopupStatus(popupId, "PUBLISHED");
          await queryClient.invalidateQueries({ queryKey: ["admin", "popups"] });
          await queryClient.invalidateQueries({ queryKey: popupKeys.live });
        }
        setBanner({ kind: "ok", text: mode === "publish" ? "Saved and published." : "Saved." });
        if (!id) router.replace(`/admin/popups/${popupId}`);
      } catch (e) {
        setBanner({ kind: "error", text: errMessage(e) });
      } finally {
        setBusy(false);
      }
    }, () => {
      setBanner({ kind: "error", text: "Fix the highlighted fields first — tabs with problems are marked." });
    })();
  };

  const changeStatus = (next: PopupStatus) => {
    setBanner(null);
    statusMutation.mutate(next, {
      onSuccess: () => setBanner({ kind: "ok", text: `Popup ${next.toLowerCase()}.` }),
      onError: (e) => setBanner({ kind: "error", text: errMessage(e) }),
    });
  };

  const onPreviewClick = () => {
    previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    previewRef.current?.play();
  };

  // ---- loading / error ----

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-72 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }
  if (isEdit && (isError || !data)) {
    const code = error instanceof ApiError ? error.status : 0;
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-admin-border bg-admin-card p-6 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <p className="text-sm font-semibold">
          {code === 404 ? "This popup doesn't exist." : code === 403 ? "You don't have permission to view this popup." : "Couldn't load this popup."}
        </p>
        <div className="flex gap-2">
          {code !== 404 && code !== 403 && (
            <button type="button" onClick={() => refetch()} className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90">
              Retry
            </button>
          )}
          <Link href="/admin/popups" className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark">
            Back to Popups
          </Link>
        </div>
      </div>
    );
  }

  const visibleFor = (device: PopupDevice) => {
    const { runtime } = runtimeFromForm(values, device);
    return runtime ? describeVisibleDuration(runtime) : null;
  };

  const btnPrimary =
    "rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50";
  const btnSecondary =
    "rounded-full border border-admin-border px-5 py-2.5 text-center text-sm font-semibold hover:bg-black/5 disabled:opacity-50 dark:border-admin-border-dark dark:hover:bg-white/5";
  const working = busy || statusMutation.isPending;

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/admin/popups" className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white">
            <IconChevronLeft className="h-4 w-4" />
            Popups
          </Link>
          <span className="text-black/30 dark:text-white/30">/</span>
          <span className="font-semibold">{popup?.name ?? "New popup"}</span>
          {popup && <PopupStatusBadge state={popup.effectiveState} />}
        </div>

        {banner && (
          <p
            role={banner.kind === "error" ? "alert" : "status"}
            className={`rounded-xl p-3 text-xs font-semibold ${
              banner.kind === "error" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            {banner.text}
          </p>
        )}

        {readOnly && (
          <div className={`${CARD} sm:flex sm:items-center sm:justify-between sm:space-y-0`}>
            <p className="text-sm text-black/60 dark:text-white/60">This popup is archived. Restore it as a draft to edit it.</p>
            <button type="button" disabled={working} onClick={() => changeStatus("DRAFT")} className="mt-3 rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50 sm:mt-0">
              Restore as draft
            </button>
          </div>
        )}

        {/* Tabs */}
        <div role="tablist" aria-label="Popup settings" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id ? "bg-admin-primary text-black" : "text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
              }`}
            >
              {t.label}
              {errorTabs.has(t.id) && (
                <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" aria-label="has errors" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => e.preventDefault()} noValidate className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <fieldset disabled={readOnly} className="min-w-0 space-y-4 xl:col-span-3">
            {/* General */}
            <section role="tabpanel" id="panel-general" aria-labelledby="tab-general" hidden={tab !== "general"} className={CARD}>
              <TextField name="name" label="Popup name *" placeholder="e.g. Welcome offer" maxLength={120} hint="Internal only — visitors never see this." />
              <NumberField name="priority" label="Priority" unit="0–1000" hint="Lower numbers win when more than one popup is live. Only one popup shows per visit." />
              <div className="space-y-2">
                <p className={LABEL}>Show on</p>
                <ToggleField name="devices.desktop.enabled" label="Desktop" />
                <ToggleField name="devices.mobile.enabled" label="Mobile" />
              </div>
            </section>

            {/* Content & design */}
            <section role="tabpanel" id="panel-content" aria-labelledby="tab-content" hidden={tab !== "content"} className={CARD}>
              <p className={HINT}>Upload a separate banner for desktop and mobile. Each screen shows its own image. Desktop positioning is in the Desktop tab.</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <BannerImageField
                  name="content.desktopImageUrl"
                  label="Desktop image"
                  hint="Upload your desktop banner. Only shown on desktop."
                />
                <BannerImageField
                  name="content.mobileImageUrl"
                  label="Mobile image"
                  hint="Upload your mobile banner. Mobile alignment stays the same."
                />
              </div>
              <details
                open={Boolean(errorAt(formState.errors, "content.imageUrl")) || undefined}
                className="rounded-xl border border-admin-border p-3 dark:border-admin-border-dark"
              >
                <summary className="cursor-pointer text-xs font-semibold">Shared fallback image (optional)</summary>
                <div className="mt-3">
                  <BannerImageField
                    name="content.imageUrl"
                    label="Fallback banner image"
                    hint="Used only when a device has no image of its own. Existing banners remain here."
                  />
                </div>
              </details>
              <TextField name="content.heading" label="Heading (optional)" maxLength={120} />
              <TextField name="content.body" label="Body text (optional)" multiline maxLength={500} />
              <TextField name="content.imageAlt" label="Image description (alt text)" maxLength={200} hint="Read by screen readers. Leave empty for a purely decorative image." />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField name="content.ctaLabel" label="Button label" maxLength={40} />
                <TextField name="content.ctaUrl" label="Button link" placeholder="/products or https://…" />
              </div>
              <ToggleField
                name="design.imageOnly"
                label="Image only — hide the heading, text and button"
                hint="Removes the white text area so just the image (and countdown, if on) is shown. Your text stays saved. Needs an image."
              />
              <div className="space-y-3 rounded-xl border border-admin-border p-3 dark:border-admin-border-dark">
                <ToggleField
                  name="countdown.enabled"
                  label="Show an offer countdown timer"
                  hint="Days · hours · minutes · seconds ticking down to a deadline, to create urgency. Turns red and pulses in the final hour. Separate from the auto-close timer."
                />
                {values.countdown?.enabled && (
                  <div className="space-y-3">
                    <TextField name="countdown.label" label="Countdown headline (optional)" maxLength={80} placeholder="Leave empty for numbers only" />
                    <SelectField
                      name="countdown.position"
                      label="Countdown position on the banner"
                      hint="Where the timer sits on the banner image. Pick a spot that doesn't cover the artwork."
                      options={[
                        { value: "TOP_LEFT", label: "Top left" },
                        { value: "TOP_CENTER", label: "Top centre" },
                        { value: "TOP_RIGHT", label: "Top right" },
                        { value: "BOTTOM_LEFT", label: "Bottom left" },
                        { value: "BOTTOM_CENTER", label: "Bottom centre" },
                        { value: "BOTTOM_RIGHT", label: "Bottom right" },
                      ]}
                    />
                    <label className={LABEL} htmlFor="countdownEndsAt">Countdown ends</label>
                    <input
                      id="countdownEndsAt"
                      type="datetime-local"
                      key={`c-${popup?.updatedAt ?? "new"}-${countdownNonce}`}
                      defaultValue={toLocalInput(values.countdown.endsAt ?? popup?.countdown.endsAt)}
                      onChange={(e) =>
                        setValue("countdown.endsAt", e.target.value ? new Date(e.target.value).toISOString() : null, { shouldDirty: true })
                      }
                      className={FIELD}
                    />
                    <div className="mt-2 flex gap-2">
                      {[
                        ["+1 hour", 3_600_000],
                        ["+24 hours", 86_400_000],
                        ["+3 days", 259_200_000],
                      ].map(([label, ms]) => (
                        <button
                          key={label as string}
                          type="button"
                          onClick={() => {
                            setValue("countdown.endsAt", new Date(Date.now() + (ms as number)).toISOString(), { shouldDirty: true });
                            setCountdownNonce((n) => n + 1);
                          }}
                          className="rounded-full border border-admin-border px-2.5 py-1 text-xs font-semibold dark:border-admin-border-dark"
                        >
                          {label as string}
                        </button>
                      ))}
                    </div>
                    {errorAt(formState.errors, "countdown.endsAt") && <p className={ERR}>{errorAt(formState.errors, "countdown.endsAt")}</p>}
                    <p className={HINT}>Once the deadline passes the timer hides itself. It does not unpublish the popup — use Schedule for that.</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField name="design.theme" label="Theme" options={[{ value: "LIGHT", label: "Light" }, { value: "DARK", label: "Dark" }, { value: "BRAND", label: "Brand green" }]} />
                <SelectField name="design.size" label="Size" options={[{ value: "SM", label: "Small" }, { value: "MD", label: "Medium" }, { value: "LG", label: "Large" }]} />
              </div>
            </section>

            {/* Desktop */}
            <section role="tabpanel" id="panel-desktop" aria-labelledby="tab-desktop" hidden={tab !== "desktop"} className={CARD}>
              <ToggleField name="devices.desktop.enabled" label="Show on desktop" />
              <DesktopPlacementField />
              {useShared ? (
                <PerDeviceNote />
              ) : (
                <>
                  <OpenCloseTimingFields base="timing.desktop" />
                  <CloseControlFields base="timing.desktop" />
                </>
              )}
            </section>

            {/* Mobile */}
            <section role="tabpanel" id="panel-mobile" aria-labelledby="tab-mobile" hidden={tab !== "mobile"} className={CARD}>
              <ToggleField name="devices.mobile.enabled" label="Show on mobile (screens narrower than 768px)" />
              <SelectField name="devices.mobile.placement" label="Placement" options={[{ value: "BOTTOM_SHEET", label: "Bottom sheet" }, { value: "CENTER", label: "Centred dialog" }]} />
              {useShared ? (
                <PerDeviceNote />
              ) : (
                <>
                  <OpenCloseTimingFields base="timing.mobile" />
                  <CloseControlFields base="timing.mobile" />
                </>
              )}
            </section>

            {/* Triggers & display timing */}
            <section role="tabpanel" id="panel-triggers" aria-labelledby="tab-triggers" hidden={tab !== "triggers"} className={CARD}>
              <ToggleField
                name="timing.useSharedTimingSettings"
                label="Use shared timing settings"
                onToggle={onSharedToggle}
                hint="On: desktop and mobile share the values below. Off: each device has its own (Desktop / Mobile tabs). Switching copies the current values across."
              />
              {useShared ? (
                <OpenCloseTimingFields base="timing.shared" />
              ) : (
                <PerDeviceNote2 />
              )}

              <div className="rounded-xl bg-black/5 p-3 text-xs dark:bg-white/5" aria-live="polite">
                <p className="font-semibold">Display duration</p>
                {(["desktop", "mobile"] as const).map((d) => {
                  const dur = visibleFor(d);
                  return (
                    <p key={d} className="mt-1 text-black/60 dark:text-white/60">
                      <span className="capitalize">{d}</span>:{" "}
                      {dur
                        ? `visible for ${dur.cappedByMax ? "up to " : ""}${dur.seconds}s once open (${dur.viaAutoClose ? "auto-close" : "maximum display time"})`
                        : "switched off"}
                    </p>
                  );
                })}
              </div>

              <NumberField name="display.maxDisplaySeconds" label="Maximum display time" hint={`Hard ceiling — the popup always closes by itself after this, whatever else is set (${L.maxDisplaySeconds.min}–${L.maxDisplaySeconds.max}).`} />

              <ToggleField
                name="display.showOnEveryLoad"
                label="Show on every page refresh and after login"
                hint="The popup appears again each time the page is loaded or refreshed, and right after a visitor logs in. The per-session limit and any earlier dismissal are ignored (a dismissal only lasts until the next refresh)."
              />
              <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${values.display?.showOnEveryLoad ? "opacity-50" : ""}`}>
                <NumberField name="display.sessionDisplayLimit" label="Per session" unit="times" hint="Max appearances per visitor session." />
                <NumberField name="display.repeatIntervalSeconds" label="Repeat interval" hint="0 = don't repeat. Otherwise wait this long after it closes." />
                <NumberField name="display.minReappearanceSeconds" label="Minimum gap" hint="Never reopen sooner than this after it closes." />
              </div>

              <div>
                <label className={LABEL} htmlFor="includePaths">Only show on these pages (optional)</label>
                <textarea
                  id="includePaths"
                  rows={3}
                  placeholder={"/\n/products\n/blog"}
                  defaultValue={(popup?.targeting.includePaths ?? []).join("\n")}
                  key={popup?.id ?? "new"}
                  onChange={(e) =>
                    setValue(
                      "targeting.includePaths",
                      e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                      { shouldDirty: true }
                    )
                  }
                  className={`${FIELD} font-mono`}
                />
                <p className={HINT}>One path per line (prefix match). Empty = all pages. Checkout, cart, login, account and admin pages never show popups.</p>
                {Object.keys(formState.errors.targeting ?? {}).length > 0 && <p className={ERR}>Each path must start with a single “/”.</p>}
              </div>
            </section>

            {/* Close button & dismissal */}
            <section role="tabpanel" id="panel-close" aria-labelledby="tab-close" hidden={tab !== "close"} className={CARD}>
              {useShared ? (
                <CloseControlFields base="timing.shared" />
              ) : (
                <p className={`${HINT} rounded-xl bg-black/5 p-3 dark:bg-white/5`}>
                  Per-device timing is on — set the × visibility, position, backdrop and Escape options in the Desktop and Mobile tabs.
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField name="display.closeButtonSize" label="Close button size" options={[{ value: "SM", label: "Small (40px)" }, { value: "MD", label: "Medium (44px)" }, { value: "LG", label: "Large (56px)" }]} />
                <SelectField name="display.closeButtonStyle" label="Close button style" options={[{ value: "SOLID", label: "Solid" }, { value: "SUBTLE", label: "Subtle" }, { value: "OUTLINED", label: "Outlined" }]} />
              </div>
              <ToggleField
                name="display.allowEarlyDismiss"
                label="Allow dismissing before the timer expires"
                onToggle={onAllowEarlyToggle}
                hint={`Off: the popup can't be closed by the visitor until it closes itself. Requires auto-close of ${L.earlyDismissLockMaxSeconds}s or less.`}
              />
              <SelectField
                name="display.dismissalPolicy"
                label="After a visitor dismisses it"
                options={[
                  { value: "SESSION_SUPPRESS", label: "Don't show again this session" },
                  { value: "WAIT_INTERVAL", label: "Wait a set time before showing again" },
                  { value: "FOLLOW_FREQUENCY", label: "Follow the normal frequency rules" },
                ]}
              />
              {values.display?.dismissalPolicy === "WAIT_INTERVAL" && (
                <NumberField name="display.dismissalWaitSeconds" label="Wait before showing again" hint="Remembered across visits (86,400 = 1 day)." />
              )}
              <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold">Visitors are never trapped</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  <li>Every popup closes itself at the maximum display time.</li>
                  <li>If the × is hidden, a “No thanks” link is shown.</li>
                  <li>Popups never appear on checkout, cart, login, account or admin pages.</li>
                </ul>
              </div>
            </section>

            {/* Schedule */}
            <section role="tabpanel" id="panel-schedule" aria-labelledby="tab-schedule" hidden={tab !== "schedule"} className={CARD}>
              <p className="text-sm text-black/60 dark:text-white/60">
                Leave both empty to run as soon as the popup is published. Times use your browser&apos;s time zone.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL} htmlFor="startsAt">Starts</label>
                  <input
                    id="startsAt"
                    type="datetime-local"
                    key={`s-${popup?.updatedAt ?? "new"}`}
                    defaultValue={toLocalInput(popup?.schedule.startsAt)}
                    onChange={(e) => setValue("schedule.startsAt", e.target.value ? new Date(e.target.value).toISOString() : null, { shouldDirty: true })}
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className={LABEL} htmlFor="endsAt">Ends</label>
                  <input
                    id="endsAt"
                    type="datetime-local"
                    key={`e-${popup?.updatedAt ?? "new"}`}
                    defaultValue={toLocalInput(popup?.schedule.endsAt)}
                    onChange={(e) => setValue("schedule.endsAt", e.target.value ? new Date(e.target.value).toISOString() : null, { shouldDirty: true })}
                    className={FIELD}
                  />
                  {errorAt(formState.errors, "schedule.endsAt") && <p className={ERR}>{errorAt(formState.errors, "schedule.endsAt")}</p>}
                </div>
              </div>
              {popup && (
                <p className="text-xs text-black/50 dark:text-white/50">
                  Current state: <PopupStatusBadge state={popup.effectiveState} /> — scheduled, paused, expired and draft popups never appear publicly.
                </p>
              )}
            </section>

            {/* Analytics */}
            <section role="tabpanel" id="panel-analytics" aria-labelledby="tab-analytics" hidden={tab !== "analytics"} className={CARD}>
              {!popup ? (
                <p className="text-sm text-black/55 dark:text-white/55">Analytics appear here once the popup is live.</p>
              ) : (
                <AnalyticsTable popup={popup} />
              )}
            </section>
          </fieldset>

          {/* Right column: actions + preview */}
          <div className="space-y-4 xl:col-span-2">
            <div className={`${CARD} xl:sticky xl:top-4`} ref={previewPanelRef}>
              <div className="flex flex-wrap gap-2">
                {(status === "NEW" || status === "DRAFT") && (
                  <>
                    <button type="button" disabled={working || readOnly} onClick={() => run("draft")} className={btnSecondary}>
                      {working ? "Saving…" : "Save Draft"}
                    </button>
                    <button type="button" disabled={working || readOnly} onClick={onPreviewClick} className={btnSecondary}>
                      Preview
                    </button>
                    <button type="button" disabled={working || readOnly} onClick={() => run("publish")} className={btnPrimary}>
                      Publish
                    </button>
                  </>
                )}
                {status === "PUBLISHED" && (
                  <>
                    <button type="button" disabled={working} onClick={() => run("save")} className={btnPrimary}>
                      {working ? "Saving…" : "Publish changes"}
                    </button>
                    <button type="button" disabled={working} onClick={onPreviewClick} className={btnSecondary}>Preview</button>
                    <button type="button" disabled={working} onClick={() => changeStatus("PAUSED")} className={btnSecondary}>Pause</button>
                    <button type="button" disabled={working} onClick={() => changeStatus("DRAFT")} className={btnSecondary}>Move to draft</button>
                  </>
                )}
                {status === "PAUSED" && (
                  <>
                    <button type="button" disabled={working} onClick={() => run("save")} className={btnSecondary}>
                      {working ? "Saving…" : "Save changes"}
                    </button>
                    <button type="button" disabled={working} onClick={onPreviewClick} className={btnSecondary}>Preview</button>
                    <button type="button" disabled={working} onClick={() => changeStatus("PUBLISHED")} className={btnPrimary}>Resume</button>
                  </>
                )}
                {status === "ARCHIVED" && (
                  <button type="button" disabled={working} onClick={onPreviewClick} className={btnSecondary}>Preview</button>
                )}
                <Link href="/admin/popups" className={btnSecondary}>Cancel</Link>
              </div>
              <PopupPreview ref={previewRef} values={values} device={previewDevice} onDeviceChange={setPreviewDevice} />
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function PerDeviceNote2() {
  return (
    <p className="rounded-xl bg-black/5 p-3 text-xs text-black/55 dark:bg-white/5 dark:text-white/55">
      Per-device timing is on. Set the initial delay, auto-close and countdown separately in the <strong>Desktop</strong> and{" "}
      <strong>Mobile</strong> tabs.
    </p>
  );
}

function AnalyticsTable({ popup }: { popup: import("@/lib/api/popup").Popup }) {
  const rows = (["desktop", "mobile"] as const).map((d) => {
    const a = popup.analytics[d];
    const ctr = a.impressions ? ((a.clicks / a.impressions) * 100).toFixed(1) : "—";
    const dismiss = a.impressions ? ((a.manualCloses / a.impressions) * 100).toFixed(1) : "—";
    return { d, a, ctr, dismiss };
  });
  const total = rows.reduce((n, r) => n + r.a.impressions, 0);
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-admin-border text-xs uppercase tracking-wider text-black/50 dark:border-admin-border-dark dark:text-white/50">
              <th className="py-2 pr-3 font-semibold">Device</th>
              <th className="py-2 pr-3 font-semibold">Impressions</th>
              <th className="py-2 pr-3 font-semibold">Clicks</th>
              <th className="py-2 pr-3 font-semibold">CTR</th>
              <th className="py-2 pr-3 font-semibold">Dismissed</th>
              <th className="py-2 pr-3 font-semibold">Auto-closed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, a, ctr, dismiss }) => (
              <tr key={d} className="border-b border-admin-border/60 dark:border-admin-border-dark/60">
                <td className="py-2 pr-3 font-semibold capitalize">{d}</td>
                <td className="py-2 pr-3 tabular-nums">{a.impressions}</td>
                <td className="py-2 pr-3 tabular-nums">{a.clicks}</td>
                <td className="py-2 pr-3 tabular-nums">{ctr === "—" ? ctr : `${ctr}%`}</td>
                <td className="py-2 pr-3 tabular-nums">
                  {a.manualCloses}
                  {dismiss !== "—" && <span className="text-black/45 dark:text-white/45"> ({dismiss}%)</span>}
                </td>
                <td className="py-2 pr-3 tabular-nums">{a.autoCloses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total === 0 && <p className="text-xs text-black/50 dark:text-white/50">No impressions recorded yet. Previews never count.</p>}
    </div>
  );
}
