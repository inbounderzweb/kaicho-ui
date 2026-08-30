const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// One shared promise for the whole page lifetime: a second call while the
// script is still downloading awaits the same load instead of injecting a
// duplicate <script>, and a call after it resolved returns immediately.
let loadPromise: Promise<void> | null = null;

/**
 * Injects Razorpay's Checkout.js and resolves once `window.Razorpay` is
 * available. Loaded on demand from the checkout page rather than globally
 * in layout.tsx, so visitors who never check out never pay for it.
 * Rejects on network/blocked-script failure so the caller can show a real
 * error instead of hanging on a modal that will never open.
 */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout can only be loaded in the browser."));
  }

  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const fail = () => {
      // Clear the cached promise so a later retry (e.g. the customer
      // clicking "Pay" again after reconnecting) can re-attempt the load
      // rather than replaying the rejection forever.
      loadPromise = null;
      reject(new Error("Couldn't load the payment gateway. Check your connection and try again."));
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
    if (existing) {
      // A tag from a previous mount is still around — attach to it rather
      // than adding a second one.
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => {
      script.remove();
      fail();
    }, { once: true });
    document.body.appendChild(script);
  });

  return loadPromise;
}
