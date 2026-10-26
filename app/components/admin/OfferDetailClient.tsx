"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useOfferDetail,
  useCreateOffer,
  useUpdateOffer,
  useSetOfferStatus,
  useDeleteOffer,
} from "@/lib/hooks/admin/useOffers";
import { offerFormSchema, type OfferFormValues } from "@/lib/validation/offer.schema";
import { ApiError } from "@/lib/api/ApiError";
import { OFFER_TYPES, OFFER_TYPE_LABELS, type OfferFormPayload, type OfferProductRef, type OfferType } from "@/lib/api/offer";
import { offerConditions, offerTitle } from "@/lib/offers/matching";
import OfferStatusBadge from "./OfferStatusBadge";
import OfferUsageClient from "./OfferUsageClient";
import ConfirmDialog from "./ConfirmDialog";
import CategoryImagePicker, { type PickedImage } from "./CategoryImagePicker";
import OfferProductPicker, { type PickedProduct } from "./offers/OfferProductPicker";
import OfferCategoryPicker from "./offers/OfferCategoryPicker";
import OfferSimulator from "./offers/OfferSimulator";
import { IconChevronLeft } from "../ui/icons";

const FIELD =
  "w-full rounded-xl border border-admin-border bg-admin-surface px-3 py-2 text-sm outline-none focus:border-admin-primary-dark dark:border-admin-border-dark dark:bg-admin-surface-dark";
const LABEL = "mb-1 block text-xs font-semibold uppercase tracking-wider text-black/50 dark:text-white/50";
const CARD =
  "space-y-4 rounded-2xl border border-admin-border bg-admin-card p-5 dark:border-admin-border-dark dark:bg-admin-card-dark";
const ERR = "mt-1 text-xs text-red-600 dark:text-red-400";
const HINT = "mt-1 text-[11px] text-black/45 dark:text-white/45";

// <input type="datetime-local"> speaks local "YYYY-MM-DDTHH:mm"; the API speaks ISO.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIsoOrNull(local?: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

const toPicked = (p: OfferProductRef): PickedProduct => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  sellingPrice: p.sellingPrice,
  imageUrl: p.imageUrl ?? null,
});

const TYPE_HINTS: Record<OfferType, string> = {
  BOGO: "The customer buys the products you pick, and gets the free product(s) you pick at no charge.",
  PERCENTAGE: "A percentage is taken off every unit of the products you pick.",
  FIXED: "A fixed rupee amount is taken off every unit of the products you pick (never more than the item costs).",
};

const EMPTY: OfferFormValues = {
  name: "",
  description: "",
  type: "BOGO",
  applyToAll: false,
  buyQuantity: "1",
  maxFreeUnitsPerOrder: "1",
  minPaidUnitPrice: "",
  discountPercent: "",
  discountAmount: "",
  allowCouponStacking: false,
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  usageLimitPerUser: "",
  status: "DRAFT",
};

export default function OfferDetailClient({ id }: { id?: string }) {
  const isEdit = Boolean(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "usage" ? "usage" : "details";

  const { data, isLoading, isError, error, refetch } = useOfferDetail(id ?? null);
  const createMutation = useCreateOffer();
  const updateMutation = useUpdateOffer(id ?? "");
  const statusMutation = useSetOfferStatus(id ?? "");
  const deleteMutation = useDeleteOffer(id ?? "");

  const [savedFlash, setSavedFlash] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);

  const [eligibleProducts, setEligibleProducts] = useState<PickedProduct[]>([]);
  const [freeProducts, setFreeProducts] = useState<PickedProduct[]>([]);
  const [freeError, setFreeError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [excludedProducts, setExcludedProducts] = useState<PickedProduct[]>([]);
  const [excludedCategoryIds, setExcludedCategoryIds] = useState<string[]>([]);
  const [image, setImage] = useState<PickedImage | null>(null);

  const form = useForm<OfferFormValues>({ resolver: zodResolver(offerFormSchema), defaultValues: EMPTY });
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form;

  const offer = data?.offer;

  useEffect(() => {
    if (!offer) return;
    reset({
      name: offer.name,
      description: offer.description ?? "",
      type: offer.type,
      applyToAll: false,
      buyQuantity: String(offer.buyQuantity),
      maxFreeUnitsPerOrder: String(offer.maxFreeUnitsPerOrder),
      minPaidUnitPrice: offer.minPaidUnitPrice ? String(offer.minPaidUnitPrice) : "",
      discountPercent: offer.discountPercent != null ? String(offer.discountPercent) : "",
      discountAmount: offer.discountAmount != null ? String(offer.discountAmount) : "",
      allowCouponStacking: offer.allowCouponStacking,
      startsAt: toLocalInput(offer.startsAt),
      endsAt: toLocalInput(offer.endsAt),
      usageLimit: offer.usageLimit != null ? String(offer.usageLimit) : "",
      usageLimitPerUser: offer.usageLimitPerUser != null ? String(offer.usageLimitPerUser) : "",
      status: offer.status,
    });
    // Deferred a tick (same approach as the slug suggestion in
    // CategoryDetailClient) so these don't setState synchronously in the effect.
    const t = setTimeout(() => {
      setEligibleProducts(offer.eligibleProducts.map(toPicked));
      setFreeProducts((offer.freeProducts ?? []).map(toPicked));
      setExcludedProducts(offer.excludedProducts.map(toPicked));
      setExcludedCategoryIds(offer.excludedCategories.map((c) => c.id));
      setImage(offer.image ? { mediaId: offer.image.mediaId, url: offer.image.url, thumbnailUrl: offer.image.thumbnailUrl } : null);
    }, 0);
    return () => clearTimeout(t);
  }, [offer, reset]);

  const watched = useWatch({ control }) as Partial<OfferFormValues>;
  const mutation = isEdit ? updateMutation : createMutation;
  const mutationError = mutation.error instanceof ApiError ? mutation.error.message : null;

  const onSubmit = (values: OfferFormValues) => {
    const parsed = offerFormSchema.parse(values);
    const type = parsed.type;
    if (eligibleProducts.length === 0) {
      setScopeError(
        type === "BOGO" ? "Choose at least one product the customer must buy." : "Choose at least one eligible product."
      );
      return;
    }
    setScopeError(null);

    // A Buy X Get Y Free offer must say what is free before it can go live
    // (the server enforces this too). Drafts may be saved incomplete.
    const goingLive = isEdit ? offer?.status === "ACTIVE" : parsed.status === "ACTIVE" || parsed.status === "SCHEDULED";
    if (type === "BOGO" && goingLive && freeProducts.length === 0) {
      setFreeError("Choose the free product(s) before activating this offer.");
      return;
    }
    setFreeError(null);

    const payload: OfferFormPayload = {
      name: parsed.name,
      description: parsed.description || undefined,
      type,
      imageMediaId: image?.mediaId ?? null,
      applyToAll: false,
      eligibleProductIds: eligibleProducts.map((p) => p.id),
      eligibleCategoryIds: [],
      excludedProductIds: excludedProducts.map((p) => p.id),
      excludedCategoryIds: excludedCategoryIds,
      freeProductIds: type === "BOGO" ? freeProducts.map((p) => p.id) : [],
      discountPercent: type === "PERCENTAGE" ? parsed.discountPercent ?? null : null,
      discountAmount: type === "FIXED" ? parsed.discountAmount ?? null : null,
      // Only Buy X Get Y Free uses these; the others send the neutral defaults.
      buyQuantity: type === "BOGO" ? parsed.buyQuantity ?? 1 : 1,
      maxFreeUnitsPerOrder: type === "BOGO" ? parsed.maxFreeUnitsPerOrder ?? 1 : 1,
      minPaidUnitPrice: type === "BOGO" ? parsed.minPaidUnitPrice ?? 0 : 0,
      allowCouponStacking: parsed.allowCouponStacking,
      startsAt: toIsoOrNull(parsed.startsAt),
      endsAt: toIsoOrNull(parsed.endsAt),
      usageLimit: parsed.usageLimit ?? null,
      usageLimitPerUser: parsed.usageLimitPerUser ?? null,
      status: parsed.status,
    };

    if (isEdit) {
      // Lifecycle is managed by the dedicated Activate / Deactivate control.
      const patch: Partial<OfferFormPayload> = { ...payload };
      delete patch.status;
      updateMutation.mutate(patch, {
        onSuccess: () => {
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 2500);
        },
      });
    } else {
      createMutation.mutate(payload, { onSuccess: (res) => router.push(`/admin/offers/${res.offer.id}`) });
    }
  };

  const runStatus = (next: "ACTIVE" | "DISABLED") => {
    setActionError(null);
    statusMutation.mutate(next, {
      onError: (err) => setActionError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."),
      onSettled: () => setDisableOpen(false),
    });
  };

  const runDelete = () => {
    setActionError(null);
    deleteMutation.mutate(undefined, {
      onSuccess: () => router.push("/admin/offers"),
      onError: (err) => {
        setActionError(err instanceof ApiError ? err.message : "Couldn't delete this offer. Please try again.");
        setDeleteOpen(false);
      },
    });
  };

  if (isEdit && isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-black/5 dark:bg-white/5" />
        <div className="h-96 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  if (isEdit && (isError || !data)) {
    const status = error instanceof ApiError ? error.status : 0;
    const message =
      status === 404
        ? "This offer doesn't exist."
        : status === 403
          ? "You don't have permission to view this offer."
          : "Couldn't load this offer.";
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-admin-border bg-admin-card p-6 dark:border-admin-border-dark dark:bg-admin-card-dark">
        <p className="text-sm font-semibold">{message}</p>
        <div className="flex gap-2">
          {status !== 404 && status !== 403 && (
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Retry
            </button>
          )}
          <Link href="/admin/offers" className="rounded-full border border-admin-border px-4 py-1.5 text-xs font-semibold dark:border-admin-border-dark">
            Back to Offers
          </Link>
        </div>
      </div>
    );
  }

  const isDisabledState = offer?.status === "DISABLED";
  const canActivate = offer && offer.status !== "ACTIVE";
  const canDisable = offer && offer.status === "ACTIVE";

  // Live, customer-facing preview from the current form values.
  const watchedType: OfferType = (watched.type as OfferType | undefined) ?? "BOGO";
  const separateFree =
    watchedType === "BOGO" &&
    freeProducts.length > 0 &&
    !(freeProducts.length === eligibleProducts.length && freeProducts.every((f) => eligibleProducts.some((e) => e.id === f.id)));
  const previewRule = {
    type: watchedType,
    mode: watchedType === "BOGO" ? (separateFree ? ("BOGO_ROLES" as const) : ("BOGO_POOL" as const)) : watchedType,
    discountPercent: Number(watched.discountPercent) || null,
    discountAmount: Number(watched.discountAmount) || null,
    buyQuantity: Number(watched.buyQuantity) || 1,
    maxFreeUnitsPerOrder: Number(watched.maxFreeUnitsPerOrder) || 1,
    minPaidUnitPrice: Number(watched.minPaidUnitPrice) || 0,
    allowCouponStacking: Boolean(watched.allowCouponStacking),
    endsAt: typeof watched.endsAt === "string" && watched.endsAt ? new Date(watched.endsAt).toISOString() : null,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/admin/offers"
          className="inline-flex items-center gap-1 text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <IconChevronLeft className="h-4 w-4" />
          Offers &amp; Promotions
        </Link>
        <span className="text-black/30 dark:text-white/30">/</span>
        <span className="font-semibold">{isEdit ? offer?.name ?? "Edit" : "New Offer"}</span>
        {offer && <OfferStatusBadge status={offer.effectiveStatus} />}
      </div>

      {isEdit && (
        <div className="flex gap-4 border-b border-admin-border text-sm dark:border-admin-border-dark">
          {(["details", "usage"] as const).map((t) => (
            <Link
              key={t}
              href={t === "details" ? `/admin/offers/${id}` : `/admin/offers/${id}?tab=usage`}
              className={`-mb-px border-b-2 px-1 pb-2 font-semibold ${
                tab === t
                  ? "border-admin-primary-dark text-black dark:border-admin-primary dark:text-white"
                  : "border-transparent text-black/50 dark:text-white/50"
              }`}
            >
              {t === "details" ? "Details" : `Usage${offer ? ` (${offer.usedCount})` : ""}`}
            </Link>
          ))}
        </div>
      )}

      {isEdit && tab === "usage" && id ? (
        <OfferUsageClient offerId={id} />
      ) : (
        <>
          {isEdit && offer && (
            <div className={`${CARD} sm:flex sm:items-center sm:justify-between sm:space-y-0`}>
              <div>
                <p className="text-sm font-semibold">
                  Status: <OfferStatusBadge status={offer.effectiveStatus} />
                </p>
                <p className="mt-1 text-xs text-black/55 dark:text-white/55">
                  {offer.effectiveStatus === "SCHEDULED"
                    ? "Active, but its start date hasn't arrived yet."
                    : offer.effectiveStatus === "EXPIRED"
                      ? "The end date has passed. Extend it to run the offer again."
                      : isDisabledState
                        ? "Disabled offers are hidden from the storefront and ignored at checkout."
                        : offer.status === "DRAFT"
                          ? "Drafts are not visible to customers."
                          : "Customers see this offer right now."}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                {canActivate && (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => runStatus("ACTIVE")}
                    className="rounded-full bg-admin-primary px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
                  >
                    Activate
                  </button>
                )}
                {canDisable && (
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => setDisableOpen(true)}
                    className="rounded-full border border-red-500/30 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                  >
                    Deactivate
                  </button>
                )}
                {/* Only a draft / deactivated offer that no order has used can be removed. */}
                {offer.status !== "ACTIVE" && offer.usedCount === 0 && (
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => setDeleteOpen(true)}
                    className="rounded-full border border-red-500/30 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
          {actionError && (
            <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{actionError}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
            <div className="space-y-6 lg:col-span-2">
              <div className={CARD}>
                <h2 className="text-sm font-bold">Basic information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL} htmlFor="offer-name">Offer title *</label>
                    <input id="offer-name" {...register("name")} placeholder="Buy 1 Get 1 Free · 50% Off · Flat ₹100 Off" className={FIELD} />
                    {errors.name && <p className={ERR}>{errors.name.message}</p>}
                    <p className={HINT}>Shown to customers on product cards, the cart and banners.</p>
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="offer-type">Offer type</label>
                    <select id="offer-type" {...register("type")} className={FIELD}>
                      {OFFER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {OFFER_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    <p className={HINT}>{TYPE_HINTS[watchedType]}</p>
                  </div>
                </div>
                <div>
                  <label className={LABEL} htmlFor="offer-desc">Promotional description</label>
                  <textarea id="offer-desc" {...register("description")} rows={2} placeholder="Shown to customers next to the offer badge" className={FIELD} />
                  {errors.description && <p className={ERR}>{errors.description.message}</p>}
                </div>
                <CategoryImagePicker label="Offer banner (optional)" value={image} onChange={setImage} />
              </div>

              <div className={CARD}>
                <h2 className="text-sm font-bold">
                  {watchedType === "BOGO" ? "Products the customer must buy" : "Eligible products"}
                </h2>
                <p className="text-xs text-black/55 dark:text-white/55">
                  {watchedType === "BOGO"
                    ? "The customer has to buy these to unlock the free product. Nothing else qualifies, and nothing is selected by default."
                    : "The discount applies only to the products you pick here — nothing else is discounted or gets the badge."}
                </p>
                <OfferProductPicker
                  label={watchedType === "BOGO" ? "Qualifying products" : "Products"}
                  value={eligibleProducts}
                  onChange={setEligibleProducts}
                  emptyText="None — no products selected"
                />
                {scopeError && <p className={ERR}>{scopeError}</p>}

                <div className="border-t border-admin-border pt-4 dark:border-admin-border-dark">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50">
                    Exclusions (optional)
                  </h3>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <OfferProductPicker label="Excluded products" value={excludedProducts} onChange={setExcludedProducts} emptyText="None" />
                    <OfferCategoryPicker label="Excluded categories" value={excludedCategoryIds} onChange={setExcludedCategoryIds} />
                  </div>
                </div>
              </div>

              {watchedType === "BOGO" && (
                <div className={CARD}>
                  <h2 className="text-sm font-bold">Free Product Selection</h2>
                  <p className="text-xs text-black/55 dark:text-white/55">
                    The product(s) the customer receives <strong>free</strong>. It can be a different product from the
                    one they buy, or the same one. When several are listed the customer chooses which one is free.
                  </p>
                  <OfferProductPicker
                    label="Free products"
                    value={freeProducts}
                    onChange={(next) => {
                      setFreeProducts(next);
                      setFreeError(null);
                    }}
                    emptyText="None — no free product selected"
                    headerAction={
                      <button
                        type="button"
                        disabled={eligibleProducts.length === 0}
                        onClick={() => {
                          setFreeProducts(eligibleProducts);
                          setFreeError(null);
                        }}
                        className="shrink-0 rounded-full border border-admin-border px-3 py-1 text-[11px] font-semibold hover:bg-admin-primary/10 disabled:opacity-40 dark:border-admin-border-dark"
                      >
                        Same as products to buy
                      </button>
                    }
                  />
                  {freeError && <p className={ERR}>{freeError}</p>}
                  <p className="rounded-xl bg-admin-primary/10 p-3 text-xs text-black/70 dark:text-white/70">
                    {separateFree ? (
                      <>
                        The free product is <strong>not</strong> held to the price of what was bought — a free item can cost
                        more than the item that earned it. It is free only while the customer also buys the required
                        quantity of the products above.
                      </>
                    ) : (
                      <>
                        When the free products are the same as the products to buy, the free item must cost the{" "}
                        <strong>same or less</strong> than the item it is paired with. A more expensive item is never made
                        free.
                      </>
                    )}{" "}
                    The server enforces this on every cart and order.
                  </p>
                </div>
              )}

              <div className={CARD}>
                <h2 className="text-sm font-bold">Offer rules</h2>
                {watchedType === "BOGO" && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className={LABEL} htmlFor="offer-buy">Purchase quantity *</label>
                        <input id="offer-buy" type="number" min={1} max={10} {...register("buyQuantity")} className={FIELD} />
                        {errors.buyQuantity && <p className={ERR}>{errors.buyQuantity.message}</p>}
                        <p className={HINT}>Qualifying units needed per free unit.</p>
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="offer-max">Max free units per order *</label>
                        <input id="offer-max" type="number" min={1} max={100} {...register("maxFreeUnitsPerOrder")} className={FIELD} />
                        {errors.maxFreeUnitsPerOrder && <p className={ERR}>{errors.maxFreeUnitsPerOrder.message}</p>}
                        <p className={HINT}>Each free unit needs {Number(watched.buyQuantity) || 1} qualifying unit{(Number(watched.buyQuantity) || 1) === 1 ? "" : "s"}. Enter 100 for no practical limit.</p>
                      </div>
                      <div>
                        <label className={LABEL} htmlFor="offer-min">Min purchased price (₹)</label>
                        <input id="offer-min" type="number" step="any" min={0} placeholder="No minimum" {...register("minPaidUnitPrice")} className={FIELD} />
                        {errors.minPaidUnitPrice && <p className={ERR}>{errors.minPaidUnitPrice.message}</p>}
                        <p className={HINT}>The item bought must cost at least this.</p>
                      </div>
                    </div>
                    <p className={HINT}>The customer receives 1 free unit per set; &ldquo;Buy 2 Get 1 Free&rdquo; = purchase quantity 2.</p>
                  </>
                )}
                {watchedType === "PERCENTAGE" && (
                  <div className="max-w-xs">
                    <label className={LABEL} htmlFor="offer-percent">Discount percentage *</label>
                    <div className="relative">
                      <input id="offer-percent" type="number" step="any" min={0} max={100} placeholder="e.g. 50" {...register("discountPercent")} className={`${FIELD} pr-8`} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/45 dark:text-white/45">%</span>
                    </div>
                    {errors.discountPercent && <p className={ERR}>{errors.discountPercent.message}</p>}
                    <p className={HINT}>Taken off every unit of the products above. No free product is created.</p>
                  </div>
                )}
                {watchedType === "FIXED" && (
                  <div className="max-w-xs">
                    <label className={LABEL} htmlFor="offer-amount">Discount amount (₹) *</label>
                    <input id="offer-amount" type="number" step="any" min={0} placeholder="e.g. 100" {...register("discountAmount")} className={FIELD} />
                    {errors.discountAmount && <p className={ERR}>{errors.discountAmount.message}</p>}
                    <p className={HINT}>Taken off each unit of the products above, but never more than the item costs.</p>
                  </div>
                )}
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input type="checkbox" {...register("allowCouponStacking")} className="mt-0.5 h-4 w-4" />
                  <span>
                    <span className="font-semibold">Allow coupon codes together with this offer</span>
                    <span className="block text-xs text-black/55 dark:text-white/55">
                      Off: a coupon is refused when this offer applies. On: the coupon discounts only what is left to pay after the offer.
                    </span>
                  </span>
                </label>
                <p className={HINT}>If several offers cover the same product, only the one that saves the customer the most is applied — offers are never added together.</p>
              </div>

              <div className={CARD}>
                <h2 className="text-sm font-bold">Schedule &amp; limits</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL} htmlFor="offer-start">Start date &amp; time</label>
                    <input id="offer-start" type="datetime-local" {...register("startsAt")} className={FIELD} />
                    {errors.startsAt && <p className={ERR}>{errors.startsAt.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="offer-end">End date &amp; time</label>
                    <input id="offer-end" type="datetime-local" {...register("endsAt")} className={FIELD} />
                    {errors.endsAt && <p className={ERR}>{errors.endsAt.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="offer-limit">Total redemptions limit</label>
                    <input id="offer-limit" type="number" min={1} placeholder="Unlimited" {...register("usageLimit")} className={FIELD} />
                    {errors.usageLimit && <p className={ERR}>{errors.usageLimit.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="offer-limit-user">Per-customer limit</label>
                    <input id="offer-limit-user" type="number" min={1} placeholder="Unlimited" {...register("usageLimitPerUser")} className={FIELD} />
                    {errors.usageLimitPerUser && <p className={ERR}>{errors.usageLimitPerUser.message}</p>}
                  </div>
                </div>
                <p className={HINT}>Limits count orders, not units.</p>
                {isEdit && offer && (
                  <p className="text-xs text-black/55 dark:text-white/55">
                    {offer.usedCount} redemption{offer.usedCount === 1 ? "" : "s"} so far.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {!isEdit && (
                <div className={CARD}>
                  <h2 className="text-sm font-bold">Status</h2>
                  <select {...register("status")} aria-label="Offer status" className={FIELD}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SCHEDULED">Scheduled (needs a future start)</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                  {errors.status && <p className={ERR}>{errors.status.message}</p>}
                  <p className="text-xs text-black/55 dark:text-white/55">
                    Expired is automatic once the end date passes.
                  </p>
                </div>
              )}

              {mutationError && (
                <p className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{mutationError}</p>
              )}
              {savedFlash && (
                <p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Saved.</p>
              )}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-full bg-admin-primary px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create Offer"}
              </button>

              {/* Customer-facing preview, driven by the live form values. */}
              <div className={CARD}>
                <h2 className="text-sm font-bold">Customer preview</h2>
                <div className="rounded-xl border border-dashed border-admin-border p-3 dark:border-admin-border-dark">
                  <span className="inline-flex rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                    {offerTitle({ ...previewRule, name: watched.name ?? "" })}
                  </span>
                  <p className="mt-2 text-sm font-semibold">{watched.name || "Offer title"}</p>
                  {watched.description && (
                    <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">{watched.description}</p>
                  )}
                  <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-black/60 dark:text-white/60">
                    {offerConditions(previewRule).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {isEdit && offer && (
                <div className={CARD}>
                  <h2 className="text-sm font-bold">Performance</h2>
                  <dl className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Orders", offer.stats.orders],
                      ["Free units", offer.stats.freeUnits],
                      ["Discount", `₹${offer.stats.totalDiscount}`],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-admin-surface p-2 dark:bg-admin-surface-dark">
                        <dd className="text-sm font-bold tabular-nums">{v}</dd>
                        <dt className="text-[10px] uppercase tracking-wider text-black/50 dark:text-white/50">{k}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {isEdit && id && (
                <div className={CARD}>
                  <h2 className="text-sm font-bold">Preview with a sample cart</h2>
                  <OfferSimulator offerId={id} type={offer?.type ?? "BOGO"} />
                </div>
              )}

              {isEdit && offer && offer.activity.length > 0 && (
                <div className={CARD}>
                  <h2 className="text-sm font-bold">Activity</h2>
                  <ul className="space-y-3">
                    {offer.activity.map((a) => (
                      <li key={a.id} className="text-xs">
                        <p className="font-semibold text-black/80 dark:text-white/80">
                          {a.action[0] + a.action.slice(1).toLowerCase()}
                          <span className="ml-1 font-normal text-black/45 dark:text-white/45">
                            {new Date(a.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {a.actor ? ` · ${a.actor}` : ""}
                          </span>
                        </p>
                        {a.changes.map((c, i) => (
                          <p key={i} className="text-black/55 dark:text-white/55">
                            {c.field}: {c.from} → {c.to}
                          </p>
                        ))}
                        {a.note && <p className="text-black/55 dark:text-white/55">{a.note}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this offer?"
        description="This permanently removes the offer. It hasn't been used on any order. This can't be undone."
        confirmLabel="Delete"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={runDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={disableOpen}
        title="Deactivate this offer?"
        description="Customers stop seeing it and it is no longer applied at cart or checkout. Existing orders keep their free items. You can activate it again at any time."
        confirmLabel="Deactivate"
        destructive
        isConfirming={statusMutation.isPending}
        onConfirm={() => runStatus("DISABLED")}
        onCancel={() => setDisableOpen(false)}
      />
    </div>
  );
}
