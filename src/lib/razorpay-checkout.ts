"use client";

import type { PopupCheckout } from "@/lib/auth-client";

/** Razorpay's own checkout script; it must be loaded from Razorpay so card and UPI details never touch our code. */
const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

type HandlerResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

let loading: Promise<RazorpayConstructor> | null = null;

function loadScript(): Promise<RazorpayConstructor> {
  const existing = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => { const loaded = (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay; if (loaded) resolve(loaded); else reject(new Error("Razorpay did not load")); };
    script.onerror = () => { loading = null; script.remove(); reject(new Error("Razorpay could not be reached")); };
    document.head.appendChild(script);
  });
  return loading;
}

export type PopupResult = { outcome: "paid"; proof: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string } } | { outcome: "closed" };

/**
 * Opens Razorpay's payment popup over our page. Resolves with the signed proof once the parent pays,
 * or "closed" if they close it. Failed attempts stay inside the popup so the parent can retry.
 */
export async function openRazorpayPopup(popup: PopupCheckout, onFailedAttempt: (message: string) => void): Promise<PopupResult> {
  const Razorpay = await loadScript();
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
      handler: (response: HandlerResponse) => resolve({ outcome: "paid", proof: { razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature } }),
      modal: { ondismiss: () => resolve({ outcome: "closed" }), confirm_close: true },
    });
    checkout.on("payment.failed", (response) => onFailedAttempt(response.error?.description ?? "The payment didn't go through. You can try again."));
    checkout.open();
  });
}
