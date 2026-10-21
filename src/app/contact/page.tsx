import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, type PolicySection } from "@/components/layout/policy-page";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_CONTACT_NAME, PRIVACY_CONTACT_PHONE, PRIVACY_CONTACT_ROLE, PRIVACY_OPERATOR } from "@/lib/privacy";
import { BUSINESS_ADDRESS, SUPPORT_RESPONSE_TIME } from "@/lib/site-info";

export const metadata: Metadata = {
  title: "Contact Us | Play & Learn",
  description: "How to reach Play & Learn for help, payments, refunds and privacy.",
};

const sections: readonly PolicySection[] = [
  { id: "details", title: "Contact details", body: <ul>
    <li><strong>{PRIVACY_OPERATOR}</strong></li>
    <li>Contact person: {PRIVACY_CONTACT_NAME}, {PRIVACY_CONTACT_ROLE}</li>
    <li>Email: <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a></li>
    <li>Phone: <a href={`tel:${PRIVACY_CONTACT_PHONE.replace(/\s/g, "")}`}>{PRIVACY_CONTACT_PHONE}</a></li>
    {BUSINESS_ADDRESS ? <li>Address: {BUSINESS_ADDRESS}</li> : null}
  </ul> },
  { id: "help", title: "Getting help", body: <>
    <p>Email us and we will reply {SUPPORT_RESPONSE_TIME}. For anything about a payment, please write from the email address on your parent account and include the date of payment and the payment reference number, so we can find it quickly.</p>
    <ul>
      <li>Refunds and cancellations: see our <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.</li>
      <li>Your data and privacy: see our <Link href="/privacy">Privacy Policy</Link>.</li>
      <li>Rules for using the app: see our <Link href="/terms">Terms &amp; Conditions</Link>.</li>
    </ul>
  </> },
  { id: "grievance", title: "Complaints", body: <p>If you are unhappy with our service or how we handled your information, contact {PRIVACY_CONTACT_NAME} at the email above. We will acknowledge your complaint {SUPPORT_RESPONSE_TIME} and aim to resolve it within 30 days.</p> },
];

export default function ContactPage() {
  return <PolicyPage title="Contact Us" sections={sections} />;
}
