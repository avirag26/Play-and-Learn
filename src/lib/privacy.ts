/** Bump when the privacy policy changes in a way parents should agree to again. */
export const PRIVACY_POLICY_VERSION = "2026-10-18";
export const PRIVACY_LAST_UPDATED = "18 October 2026";
export const PRIVACY_OPERATOR = "Play & Learn";
export const PRIVACY_CONTACT_NAME = "Avirag P V";
export const PRIVACY_CONTACT_ROLE = "Founder & CEO";
export const PRIVACY_CONTACT_EMAIL = "playandlearn4610@gmail.com";
export const PRIVACY_CONTACT_PHONE = "+91 70123 34610";

const ACCEPTED_KEY = "play-learn-privacy-accepted-v1";

/** Whether a grown-up on this device already agreed to the current policy. */
export function hasAcceptedPrivacy(): boolean {
  try { return window.localStorage.getItem(ACCEPTED_KEY) === PRIVACY_POLICY_VERSION; } catch { return false; }
}

export function rememberPrivacyAccepted(): void {
  try { window.localStorage.setItem(ACCEPTED_KEY, PRIVACY_POLICY_VERSION); } catch { /* They will simply be asked again. */ }
}
