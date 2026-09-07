"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../ui/Breadcrumbs";
import Button from "../ui/Button";
import AddressSelector from "./AddressSelector";
import OrderSummary from "./OrderSummary";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PhoneRequiredGate from "./PhoneRequiredGate";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { useCartStore } from "@/lib/store/cart.store";
import { useCheckoutPreview } from "@/lib/hooks/useCheckoutPreview";
import { useCreateOrder } from "@/lib/hooks/useCreateOrder";
import { useVerifyPayment } from "@/lib/hooks/useVerifyPayment";
import { useAddresses } from "@/lib/hooks/useAddresses";
import { loadRazorpayScript } from "@/lib/payments/loadRazorpayScript";
import { ApiError } from "@/lib/api/ApiError";
import type { CheckoutLineInput } from "@/lib/api/checkout";
import type { PaymentMethod } from "@/lib/api/order";
import { IconCart } from "../ui/icons";

const BREADCRUMBS = [
  { label: "Home", href: "/" },
  { label: "Cart", href: "/cart" },
  { label: "Checkout", href: "/checkout" },
];

/** crypto.randomUUID() needs a secure context (https, or localhost in dev).
 *  The fallback isn't cryptographically strong, but this value only needs
 *  to be unique per checkout attempt — it's a dedupe token, not a secret. */
function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function CheckoutClient() {
  const router = useRouter();
  const { user, isAuthorized, authState, refetch } = useRequireAuth();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  // The cart persists with skipHydration (see cart.store.ts) — Providers
  // rehydrates it after mount. Until that lands, `items` is the empty
  // server-render value, which must not be mistaken for "cart is empty".
  // Subscribed to via useSyncExternalStore (rather than an effect that
  // setStates) since persist's hydration flag is exactly that: an external
  // store, with a server snapshot of "not hydrated".
  const cartHydrated = useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY");
  const [flowError, setFlowError] = useState<string | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const previewMutation = useCheckoutPreview();
  const createOrderMutation = useCreateOrder();
  const verifyPaymentMutation = useVerifyPayment();
  const { data: addresses } = useAddresses();

  // One key for the whole checkout page, generated lazily on the first
  // place-order attempt and reused by every retry — a per-click key would
  // defeat the backend's idempotency guard and could place duplicate
  // orders when a request is retried after a flaky network.
  const idempotencyKeyRef = useRef<string | null>(null);
  const getIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = createIdempotencyKey();
    return idempotencyKeyRef.current;
  };

  // Single owner of "which address is auto-selected": once the saved
  // addresses load and nothing has been explicitly chosen yet, commit the
  // default (or the only address) into selectedAddressId. AddressSelector no
  // longer runs a parallel copy of this logic — a second effect racing to
  // pick "the default" was exactly the split-brain that let the UI show a
  // selected address while validation still saw none.
  useEffect(() => {
    if (selectedAddressId || !addresses || addresses.length === 0) return;
    const preferred = addresses.find((address) => address.isDefault) ?? addresses[0];
    setSelectedAddressId(preferred.id);
  }, [addresses, selectedAddressId]);

  const lines: CheckoutLineInput[] = useMemo(
    () => items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    [items]
  );
  // Stable identity for "the cart lines actually changed", so editing an
  // unrelated part of the page doesn't re-run the preview.
  const linesKey = useMemo(() => JSON.stringify(lines), [lines]);

  const { mutate: runPreview } = previewMutation;
  useEffect(() => {
    if (!cartHydrated || !isAuthorized || lines.length === 0) return;
    runPreview(lines);
    // `lines` is re-derived every render; linesKey is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, cartHydrated, isAuthorized, runPreview]);

  const preview = previewMutation.data ?? null;
  const hasBlockingIssue = Boolean(
    preview?.items.some((item) => item.unavailable || item.insufficientStock)
  );
  const isCartEmpty = cartHydrated && items.length === 0;
  const fallbackAddressId = addresses?.find((address) => address.isDefault)?.id ?? addresses?.[0]?.id ?? null;
  const effectiveAddressId = selectedAddressId ?? fallbackAddressId;
  const isAddressReady = Boolean(effectiveAddressId);
  const disabledReason = !cartHydrated
    ? "Loading your cart..."
    : isCartEmpty
      ? "Your cart is empty."
      : hasBlockingIssue
        ? "Some items are unavailable or out of stock."
        : !isAddressReady
          ? "Select a delivery address to continue."
          : createOrderMutation.isPending || isPaying
            ? "Please wait..."
            : null;

  const goToOrder = useCallback(
    (orderNumber: string) => {
      clearCart();
      router.push(`/orders/${encodeURIComponent(orderNumber)}`);
    },
    [clearCart, router]
  );

  const handlePlaceOrder = async () => {
    if (!effectiveAddressId || lines.length === 0) return;
    setFlowError(null);
    setPendingOrderNumber(null);

    let result;
    try {
      result = await createOrderMutation.mutateAsync({
        input: { items: lines, addressId: effectiveAddressId, paymentMethod },
        idempotencyKey: getIdempotencyKey(),
      });
    } catch (err) {
      setFlowError(errorMessageOf(err, "Couldn't place your order. Please try again."));
      return;
    }

    const { order, razorpayOrder } = result;

    if (paymentMethod === "COD") {
      goToOrder(order.orderNumber);
      return;
    }

    if (!razorpayOrder) {
      // Order exists but the gateway handle is missing — don't clear the
      // cart, and point the customer at the order so they can retry there.
      setPendingOrderNumber(order.orderNumber);
      setFlowError("Your order was created but the payment couldn't be started. Open the order to try again.");
      return;
    }

    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      setPendingOrderNumber(order.orderNumber);
      setFlowError("Online payment isn't configured right now. Please try Cash on Delivery.");
      return;
    }

    try {
      setIsPaying(true);
      await loadRazorpayScript();
    } catch (err) {
      setIsPaying(false);
      setPendingOrderNumber(order.orderNumber);
      setFlowError(err instanceof Error ? err.message : "Couldn't load the payment gateway.");
      return;
    }

    const Razorpay = window.Razorpay;
    if (!Razorpay) {
      setIsPaying(false);
      setPendingOrderNumber(order.orderNumber);
      setFlowError("Couldn't load the payment gateway. Please try again.");
      return;
    }

    const checkout = new Razorpay({
      key: razorpayKey,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      name: "Kaicho Foods",
      description: `Order ${order.orderNumber}`,
      prefill: {
        name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || undefined,
        email: user?.email,
        contact: user?.phone ? `${user.countryCode}${user.phone}` : undefined,
      },
      theme: { color: "#00a861" },
      handler: (response) => {
        verifyPaymentMutation.mutate(
          {
            orderId: order.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
          {
            onSuccess: ({ order: verified }) => {
              setIsPaying(false);
              goToOrder(verified.orderNumber);
            },
            onError: () => {
              // The Razorpay webhook is the authoritative confirmation and
              // will settle this order regardless, so send the customer to
              // the order page rather than implying the payment failed.
              setIsPaying(false);
              goToOrder(order.orderNumber);
            },
          }
        );
      },
      modal: {
        ondismiss: () => {
          // Closed without paying: the order stays PENDING_PAYMENT (the
          // backend's cleanup job cancels it and restores stock after 30
          // minutes), so the cart is deliberately left intact.
          setIsPaying(false);
          setPendingOrderNumber(order.orderNumber);
          setFlowError("Payment was cancelled. Your order is saved and still awaiting payment.");
        },
      },
    });

    checkout.open();
  };

  if (authState === "error") {
    return (
      <section className="mx-auto flex max-w-[1280px] flex-col items-center justify-center gap-3 px-5 py-24 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load your account.</p>
        <p className="max-w-sm text-sm text-ink-muted">
          This looks like a connection problem, not a sign-out. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!isAuthorized || !user) {
    return (
      <section className="mx-auto flex max-w-[1280px] items-center justify-center px-5 py-24 sm:px-6 lg:px-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
      </section>
    );
  }

  // A mobile number is mandatory to check out (delivery contact). Google
  // sign-in accounts have none until they add one here. The backend enforces
  // the same rule — this is the matching UX.
  if (!user.phone) {
    return (
      <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Breadcrumbs items={BREADCRUMBS} className="mb-4" />
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
          Checkout
        </h1>
        <PhoneRequiredGate />
      </section>
    );
  }

  const previewFailed = previewMutation.isError;
  const canPlaceOrder = Boolean(
    effectiveAddressId &&
      cartHydrated &&
      !isCartEmpty &&
      !hasBlockingIssue &&
      !createOrderMutation.isPending &&
      !isPaying
  );

  return (
    <section className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Breadcrumbs items={BREADCRUMBS} className="mb-4" />

      <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand sm:text-3xl">
        Checkout
      </h1>

      {isCartEmpty ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <IconCart className="h-10 w-10 text-ink-faint" />
          <p className="mt-4 text-base font-semibold text-ink">There&apos;s nothing to check out</p>
          <p className="mt-1 text-sm text-ink-muted">
            Add something to your cart and come back to complete your order.
          </p>
          <Button href="/products" className="mt-6">
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <AddressSelector selectedId={effectiveAddressId} onSelect={setSelectedAddressId} />
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={createOrderMutation.isPending || isPaying}
            />
          </div>

          <div className="space-y-4 lg:col-span-1">
            {previewFailed ? (
              <section className="rounded-2xl border border-border bg-white p-5 text-center sm:p-6">
                <p className="text-sm font-semibold text-ink">Couldn&apos;t price your order.</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {errorMessageOf(previewMutation.error, "Something went wrong while checking your items.")}
                </p>
                <button
                  type="button"
                  onClick={() => runPreview(lines)}
                  className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                  Try again
                </button>
              </section>
            ) : (
              <OrderSummary preview={preview} isLoading={!cartHydrated || previewMutation.isPending} />
            )}

            <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 lg:sticky lg:top-24">
              {hasBlockingIssue && (
                <p className="mb-3 rounded-xl bg-sale/10 p-3 text-xs font-semibold text-sale">
                  Some items are unavailable or out of stock. Update your{" "}
                  <Link href="/cart" className="underline">
                    cart
                  </Link>{" "}
                  to continue.
                </p>
              )}

              {flowError && (
                <div className="mb-3 rounded-xl bg-sale/10 p-3 text-xs font-semibold text-sale">
                  <p>{flowError}</p>
                  {pendingOrderNumber && (
                    <Link
                      href={`/orders/${encodeURIComponent(pendingOrderNumber)}`}
                      className="mt-1 inline-block underline"
                    >
                      View order {pendingOrderNumber}
                    </Link>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand/40"
              >
                {createOrderMutation.isPending || isPaying
                  ? "Please wait…"
                  : paymentMethod === "COD"
                    ? "Place order"
                    : "Pay now"}
              </button>

              {!effectiveAddressId && (
                <p className="mt-2 text-center text-[11px] text-ink-faint">
                  Select a delivery address to continue.
                </p>
              )}
              {effectiveAddressId && !preview && !previewFailed && (
                <p className="mt-2 text-center text-[11px] text-ink-faint">
                  Pricing is still loading. You can place the order once it finishes loading.
                </p>
              )}
              {disabledReason && isAddressReady && (
                <p className="mt-2 text-center text-[11px] text-ink-faint">{disabledReason}</p>
              )}

              <Link
                href="/cart"
                className="mt-3 block text-center text-xs font-semibold text-ink-muted transition-colors hover:text-brand"
              >
                Back to cart
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
