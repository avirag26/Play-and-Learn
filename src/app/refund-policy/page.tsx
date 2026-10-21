import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, type PolicySection } from "@/components/layout/policy-page";
import { PlanPriceText } from "@/features/premium/plan-price";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_CONTACT_PHONE } from "@/lib/privacy";
import { REFUND_LAST_UPDATED, REFUND_SETTLEMENT_DAYS, REFUND_WINDOW_DAYS, SUPPORT_RESPONSE_TIME } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Play & Learn",
  description: "How cancelling and refunds work for Play & Learn Premium.",
};

const sections: readonly PolicySection[] = [
  { id: "summary", title: "The short version", body: <ul>
    <li>Premium (<PlanPriceText />) is a <strong>one-time payment</strong>. It never renews or charges you again by itself.</li>
    <li>Changed your mind? Ask within <strong>{REFUND_WINDOW_DAYS} days</strong> of paying for a <strong>full refund</strong>.</li>
    <li>Charged twice, or paid but Premium didn&apos;t unlock? We refund in full, whenever you tell us.</li>
    <li>Refunds go back to the original payment method within {REFUND_SETTLEMENT_DAYS}.</li>
  </ul> },
  { id: "cancel", title: "Cancelling", body: <>
    <p>Because Premium does not renew automatically, there is no subscription to cancel. Your Premium simply ends on the date shown in the Parent area, and you are never charged again unless you choose to buy more time.</p>
    <p>You can also end everything at once by deleting your account (<strong>Parent dashboard → Account → Delete account</strong>). This ends Premium straight away. If you want a refund, ask for it <strong>before</strong> deleting your account, as we can no longer match a payment to you afterwards.</p>
  </> },
  { id: "eligible", title: "When you can get a refund", body: <ul>
    <li><strong>Within {REFUND_WINDOW_DAYS} days of a payment</strong>, for any reason: a full refund of that payment, and the Premium time it added is removed.</li>
    <li><strong>Duplicate payments</strong>: if you were charged more than once for the same purchase, the extra payments are refunded in full.</li>
    <li><strong>Premium didn&apos;t unlock</strong>: if your payment succeeded but Premium is not working and we can&apos;t fix it, you get a full refund.</li>
    <li><strong>Premium games removed</strong>: if we permanently remove Premium games while you have paid time left, we refund the unused part.</li>
  </ul> },
  { id: "not-eligible", title: "When refunds aren't given", body: <ul>
    <li>Requests made more than {REFUND_WINDOW_DAYS} days after the payment, except in the cases above.</li>
    <li>Unused days at the end of a Premium period.</li>
    <li>Accounts closed for breaking our <Link href="/terms">Terms &amp; Conditions</Link>.</li>
  </ul> },
  { id: "how", title: "How to ask for a refund", body: <>
    <p>Email <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a> or call <a href={`tel:${PRIVACY_CONTACT_PHONE.replace(/\s/g, "")}`}>{PRIVACY_CONTACT_PHONE}</a> with:</p>
    <ul>
      <li>the email address on your parent account;</li>
      <li>the date and amount of the payment;</li>
      <li>the payment reference number from your payment confirmation, if you have it.</li>
    </ul>
    <p>We will reply {SUPPORT_RESPONSE_TIME}. Once approved, the refund is sent to the card, UPI account, bank account or wallet you paid with and normally arrives within {REFUND_SETTLEMENT_DAYS}, depending on your bank.</p>
  </> },
  { id: "failed", title: "Failed payments", body: <p>If money left your account but the payment failed or Premium was not added, the amount is normally returned automatically by your bank or our payment partner within {REFUND_SETTLEMENT_DAYS}. If it hasn&apos;t arrived after that, contact us and we will help.</p> },
];

export default function RefundPolicyPage() {
  return <PolicyPage title="Cancellation & Refund Policy" lastUpdated={REFUND_LAST_UPDATED} sections={sections} />;
}
