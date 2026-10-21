/** Business details shown on the contact, terms and refund pages. The contact person lives in `privacy.ts`. */
export const TERMS_LAST_UPDATED = "21 October 2026";
export const REFUND_LAST_UPDATED = "21 October 2026";

/** Registered business address. Payment gateways usually ask for one on the website; the line is hidden while empty. */
export const BUSINESS_ADDRESS = "";

/** How soon we answer support emails. */
export const SUPPORT_RESPONSE_TIME = "within 2 working days";

/** Days after a payment during which a parent can ask for a full refund. */
export const REFUND_WINDOW_DAYS = 7;
/** Days for an approved refund to reach the original payment method. */
export const REFUND_SETTLEMENT_DAYS = "5–7 working days";

/** Shown until the live plan loads from the API. Keep in step with `defaultPlan` in the backend. */
export const FALLBACK_PLAN = { name: "Play & Learn Premium", amount: 19_900, currency: "INR", durationDays: 30 } as const;
