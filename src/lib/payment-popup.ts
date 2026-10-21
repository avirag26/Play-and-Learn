"use client";

import type { PopupCheckout } from "@/lib/auth-client";

/** Each gateway's own checkout script: loaded from the gateway so card and UPI details never touch our code. */
const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const CASHFREE_SCRIPT = "https://sdk.cashfree.com/js/v3/cashfree.js";

type RazorpayHandlerResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;
type CashfreeResult = { error?: { message?: string }; redirect?: boolean; paymentDetails?: { paymentMessage?: string } };
type CashfreeFactory = (options: { mode: "sandbox" | "production" }) => { checkout: (options: { paymentSessionId: string; redirectTarget: "_modal" }) => Promise<CashfreeResult> };

export type PopupProof = { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string };
/**
 * "finished": the gateway says a payment completed; the API still decides whether it was paid.
 * "closed": the parent closed the popup. "redirecting": the gateway is moving to its own page and will come back.
 */
export type PopupResult = { outcome: "finished"; proof?: PopupProof } | { outcome: "closed"; message?: string } | { outcome: "redirecting" };

const loading = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  let pending = loading.get(src);
  if (!pending) {
    pending = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { loading.delete(src); script.remove(); reject(new Error(`${src} could not be reached`)); };
      document.head.appendChild(script);
    });
    loading.set(src, pending);
  }
  return pending;
}

async function openRazorpay(popup: Extract<PopupCheckout, { provider: "razorpay" }>, onFailedAttempt: (message: string) => void): Promise<PopupResult> {
  await loadScript(RAZORPAY_SCRIPT);
  const Razorpay = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (!Razorpay) throw new Error("Razorpay did not load");
  return new Promise<PopupResult>((resolve) => {
    const checkout = new Razorpay({
      key: popup.keyId,
      order_id: popup.orderId,
      amount: popup.amount,
      currency: popup.currency,
      name: "Play & Learn",
      description: popup.description,
      prefill: popup.prefill,
      theme: { color: "#30465D" },
      handler: (response: RazorpayHandlerResponse) => resolve({ outcome: "finished", proof: { razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature } }),
      modal: { ondismiss: () => resolve({ outcome: "closed" }), confirm_close: true },
    });
    // Failed attempts stay inside the popup so the parent can retry.
    checkout.on("payment.failed", (response) => onFailedAttempt(response.error?.description ?? "The payment didn't go through. You can try again."));
    checkout.open();
  });
}

async function openCashfree(popup: Extract<PopupCheckout, { provider: "cashfree" }>): Promise<PopupResult> {
  await loadScript(CASHFREE_SCRIPT);
  const Cashfree = (window as unknown as { Cashfree?: CashfreeFactory }).Cashfree;
  if (!Cashfree) throw new Error("Cashfree did not load");
  const result = await Cashfree({ mode: popup.mode }).checkout({ paymentSessionId: popup.paymentSessionId, redirectTarget: "_modal" });
  if (result.redirect) return { outcome: "redirecting" };
  if (result.paymentDetails) return { outcome: "finished" };
  return { outcome: "closed", message: result.error?.message };
}

/** Opens the gateway's payment popup over our page and reports how it ended. */
export function openPaymentPopup(popup: PopupCheckout, onFailedAttempt: (message: string) => void): Promise<PopupResult> {
  return popup.provider === "razorpay" ? openRazorpay(popup, onFailedAttempt) : openCashfree(popup);
}
