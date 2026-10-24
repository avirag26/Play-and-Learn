import type { Metadata } from "next";
import { PolicyPage, type PolicySection } from "@/components/layout/policy-page";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_CONTACT_NAME, PRIVACY_CONTACT_PHONE, PRIVACY_CONTACT_ROLE, PRIVACY_LAST_UPDATED, PRIVACY_OPERATOR } from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | Play & Learn",
  description: "What Play & Learn collects, why, and the choices parents have.",
};

const sections: readonly PolicySection[] = [
  { id: "summary", title: "The short version", body: <ul>
    <li>Children can play without an account. Their game progress stays <strong>on this device only</strong>.</li>
    <li>Only a <strong>grown-up</strong> can create an account, and only to buy and manage Premium.</li>
    <li>We collect as little as we can: a name, an email address and payment records.</li>
    <li>No ads, no tracking, no analytics, and we never sell or rent your information.</li>
  </ul> },
  { id: "collect", title: "What we collect", body: <>
    <h3>When a grown-up creates an account</h3>
    <ul>
      <li><strong>Name and email address</strong>, to sign you in and send account emails such as your sign-up code.</li>
      <li><strong>Password</strong>, stored only as a secure one-way hash. We can never see it.</li>
      <li>If you choose <strong>Continue with Google</strong>: your Google account ID, name, email address and profile picture link, shared by Google with your permission.</li>
    </ul>
    <h3>When you buy Premium</h3>
    <ul>
      <li>The plan, amount, currency, date and status of each payment, plus the payment partner&apos;s reference number.</li>
      <li>Card, UPI and bank details are entered on our payment partner&apos;s secure page. <strong>We never see or store them.</strong></li>
    </ul>
    <h3>On your device only</h3>
    <ul>
      <li>Your child&apos;s game progress, missions, recent activity and app settings are saved in this browser&apos;s local storage. They are never sent to us, and they stay on the device even when you sign in.</li>
    </ul>
    <h3>Cookies</h3>
    <ul>
      <li>We use only essential cookies to keep a grown-up signed in and to protect sign-in from misuse. There are no advertising or tracking cookies.</li>
    </ul>
  </> },
  { id: "children", title: "Children's privacy", body: <>
    <p>Play &amp; Learn is made for young children, so we keep their privacy first:</p>
    <ul>
      <li>Children never need to give us a name, email, photo, voice or location to play.</li>
      <li>Accounts are for parents and guardians only. The parent area sits behind a grown-up check.</li>
      <li>There are no chats, public profiles, ads or links that lead children to buy things.</li>
    </ul>
    <p>If you believe a child has given us personal information, contact us and we will delete it.</p>
  </> },
  { id: "use", title: "How we use it", body: <ul>
    <li>To create your account, sign you in and keep it secure.</li>
    <li>To process payments, unlock Premium and keep payment records the law requires.</li>
    <li>To send emails you need, such as sign-up codes. We do not send marketing emails.</li>
    <li>To fix problems and stop fraud or abuse.</li>
  </ul> },
  { id: "share", title: "Who we share it with", body: <>
    <p>We share information only with the services that run Play &amp; Learn, and only what each one needs:</p>
    <ul>
      <li><strong>Payment partner</strong> (PayU): to take your payment. It receives your name, email and the amount.</li>
      <li><strong>Google</strong>: only if you choose to sign in with Google.</li>
      <li><strong>Email delivery</strong>: to send sign-up codes to your email address.</li>
      <li><strong>Hosting and database providers</strong>: to store your account securely.</li>
    </ul>
    <p>We may also share information if the law requires it. We never sell your information or use it for advertising.</p>
  </> },
  { id: "retention", title: "How long we keep it", body: <ul>
    <li>Account details: until you delete your account (<strong>Parent dashboard → Account → Delete account</strong>) or ask us to. Deleting removes them straight away.</li>
    <li>Payment records: for as long as tax and accounting laws require. When an account is deleted, they are unlinked so they no longer identify you.</li>
    <li>Unfinished sign-ups: unused sign-up codes expire within minutes.</li>
  </ul> },
  { id: "rights", title: "Your choices and rights", body: <>
    <p>You can <strong>delete your account yourself</strong> at any time from <strong>Parent dashboard → Account → Delete account</strong>. You can also ask us to <strong>see, correct or delete</strong> your personal information, or withdraw your consent, at any time. Email us from the address on your account and we will reply within 30 days. This includes your rights under India&apos;s Digital Personal Data Protection Act, 2023 and similar laws where you live.</p>
    <p>To remove your child&apos;s progress, use <strong>Parent dashboard → Settings → Reset progress</strong>, or clear this site&apos;s data in your browser.</p>
  </> },
  { id: "security", title: "Keeping it safe", body: <p>We use encrypted connections, hashed passwords, short-lived sign-in tokens and signed cookies, and we limit who can reach the data. No system is perfectly secure, but if a breach affects you, we will tell you as the law requires.</p> },
  { id: "changes", title: "Changes to this policy", body: <p>If we change this policy in an important way, we will update the date at the top and ask you to agree again the next time you sign in.</p> },
  { id: "contact", title: "Contact us", body: <>
    <p>For questions, requests or complaints about privacy, contact:</p>
    <ul>
      <li><strong>{PRIVACY_CONTACT_NAME}</strong>, {PRIVACY_CONTACT_ROLE}, {PRIVACY_OPERATOR}</li>
      <li>Email: <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>{PRIVACY_CONTACT_EMAIL}</a></li>
      <li>Phone: <a href={`tel:${PRIVACY_CONTACT_PHONE.replace(/\s/g, "")}`}>{PRIVACY_CONTACT_PHONE}</a></li>
    </ul>
  </> },
];

export default function PrivacyPage() {
  return <PolicyPage title="Privacy Policy" lastUpdated={PRIVACY_LAST_UPDATED} sections={sections} />;
}
