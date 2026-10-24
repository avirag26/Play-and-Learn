import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, type PolicySection } from "@/components/layout/policy-page";
import { PlanPriceText } from "@/features/premium/plan-price";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_CONTACT_PHONE, PRIVACY_OPERATOR } from "@/lib/privacy";
import { TERMS_LAST_UPDATED } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Terms & Conditions | Play & Learn",
  description: "The terms for using Play & Learn and buying Premium.",
};

const sections: readonly PolicySection[] = [
  { id: "agreement", title: "Agreeing to these terms", body: <p>These terms apply to the Play &amp; Learn website and app (&quot;the app&quot;), run by {PRIVACY_OPERATOR} (&quot;we&quot;, &quot;us&quot;). By using the app, creating a parent account or buying Premium, you agree to these terms, our <Link href="/privacy">Privacy Policy</Link> and our <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.</p> },
  { id: "who", title: "Who can use the app", body: <ul>
    <li>The app is made for children aged 3 to 6, used with a parent or guardian nearby.</li>
    <li>Only an adult (18 or over) who is a parent or guardian may create an account or make a payment.</li>
    <li>You are responsible for how your child uses the app and for their screen time.</li>
  </ul> },
  { id: "account", title: "Your parent account", body: <ul>
    <li>Give us a real name and an email address you can access, and keep your password private.</li>
    <li>You are responsible for activity on your account. Tell us straight away if you think someone else has used it.</li>
    <li>You can delete your account at any time from <strong>Parent dashboard → Account → Delete account</strong>.</li>
  </ul> },
  { id: "premium", title: "Premium and payments", body: <ul>
    <li>Some games are free. Premium unlocks the Premium games for a fixed period. The current price is <strong><PlanPriceText /></strong>. The price and period are always shown before you pay.</li>
    <li>Prices are in Indian Rupees (INR). Any applicable taxes are shown at checkout.</li>
    <li>Payments are processed by our payment partner (PayU). Your card, UPI and bank details are entered on its secure page and we never see them. Its own terms also apply to the payment.</li>
    <li>Premium is a <strong>one-time payment and does not renew automatically</strong>. Buying again adds the time on top of any time left.</li>
    <li>Premium is linked to your parent account and can be used on any device where you sign in. It cannot be transferred or resold.</li>
    <li>We may change the price in future. A change never affects time you have already paid for.</li>
  </ul> },
  { id: "delivery", title: "Delivery", body: <p>Premium is a digital service. It is unlocked in the app as soon as your payment is confirmed, usually within a few seconds. Nothing is shipped. If Premium has not unlocked within an hour of a successful payment, contact us and we will fix it or refund you.</p> },
  { id: "refunds", title: "Cancellation and refunds", body: <p>Cancellations and refunds are covered by our <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.</p> },
  { id: "use", title: "Fair use", body: <>
    <p>Please do not:</p>
    <ul>
      <li>copy, resell or redistribute the app or its content;</li>
      <li>try to get around Premium locks, break into accounts or disrupt the app;</li>
      <li>use the app for anything unlawful.</li>
    </ul>
    <p>We may suspend or close an account that breaks these rules.</p>
  </> },
  { id: "content", title: "Our content", body: <p>The app&apos;s games, artwork, text and design belong to {PRIVACY_OPERATOR} and are licensed to you for personal, non-commercial use. Animal sound recordings are used under their own licences, listed under <strong>Animal sound credits</strong> in the Parent area.</p> },
  { id: "availability", title: "Availability and changes", body: <p>We work to keep the app running smoothly, but it may sometimes be unavailable for maintenance or reasons outside our control. We may add, change or remove games and features. If we permanently remove Premium games while you have paid time left, we will refund the unused part.</p> },
  { id: "disclaimer", title: "Disclaimer", body: <p>The app supports early learning but is not a substitute for teaching, therapy or medical advice. Play-time reminders are simple prompts and cannot guarantee healthy screen time or eye comfort. The app is provided &quot;as is&quot;, as far as the law allows.</p> },
  { id: "liability", title: "Limit of liability", body: <p>As far as the law allows, we are not liable for indirect or consequential losses, and our total liability to you is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under consumer protection law.</p> },
  { id: "law", title: "Governing law", body: <p>These terms are governed by the laws of India. Any dispute will be handled by the courts of India, and we will always try to resolve it with you directly first.</p> },
  { id: "changes", title: "Changes to these terms", body: <p>We may update these terms. The date at the top shows the latest version. If a change is important, we will let you know in the app before it applies.</p> },
  { id: "contact", title: "Contact us", body: <p>Questions about these terms? Email <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a> or call <a href={`tel:${PRIVACY_CONTACT_PHONE.replace(/\s/g, "")}`}>{PRIVACY_CONTACT_PHONE}</a>. More ways to reach us are on our <Link href="/contact">contact page</Link>.</p> },
];

export default function TermsPage() {
  return <PolicyPage title="Terms & Conditions" lastUpdated={TERMS_LAST_UPDATED} sections={sections} />;
}
