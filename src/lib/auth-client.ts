// Talks to the account API through the app's /api proxy. Session tokens live in httpOnly cookies,
// so this code never sees them: it only learns who is signed in.

export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled";
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  providers: ("password" | "google")[];
  subscription: { status: SubscriptionStatus; plan: string | null; currentPeriodEnd: string | null };
  createdAt: string;
};
export type AuthProviders = { password: boolean; google: boolean };
/** Sign-up step 1 result: a code was emailed. Times are in seconds. */
export type CodeSent = { email: string; expiresIn: number; resendIn: number };

export class AuthError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const OFFLINE_MESSAGE = "Can't reach the account service. Check your connection and try again.";
// Routes where a 401 is the answer itself, not an expired access token.
const NO_RETRY = new Set(["/auth/login", "/auth/register", "/auth/register/resend", "/auth/register/verify", "/auth/refresh", "/auth/logout"]);

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time per page, shared by every request that hit an expired access token. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((response) => response.ok, () => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

async function messageFrom(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) return message.filter((item) => typeof item === "string").join(" ");
    if (typeof message === "string") return message;
  } catch { /* Not JSON; fall through. */ }
  return response.status === 429 ? "Too many tries. Please wait a minute and try again." : "Something went wrong. Please try again.";
}

async function call<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, credentials: "same-origin", headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
  } catch {
    throw new AuthError(OFFLINE_MESSAGE, 0);
  }
  if (response.status === 401 && retry && !NO_RETRY.has(path) && await refreshSession()) return call<T>(path, init, false);
  // The dev proxy answers 500/502/504 when the API is not running.
  if (!response.ok) throw new AuthError(response.status >= 500 && response.status !== 503 && !response.headers.get("content-type")?.includes("json") ? OFFLINE_MESSAGE : await messageFrom(response), response.status);
  return response.status === 204 ? undefined as T : await response.json() as T;
}

/** The signed-in parent, or null when nobody is signed in. Other failures throw. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try { return (await call<{ user: AuthUser }>("/auth/me")).user; }
  catch (error) { if (error instanceof AuthError && error.status === 401) return null; throw error; }
}

export async function getProviders(): Promise<AuthProviders> {
  return call<AuthProviders>("/auth/providers");
}

export async function login(email: string, password: string): Promise<AuthUser> {
  return (await call<{ user: AuthUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })).user;
}

/** Sign-up step 1: emails a 6-digit code. The account is created by {@link verifySignUp}. */
export async function register(name: string, email: string, password: string): Promise<CodeSent> {
  return call<CodeSent>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
}

/** Sign-up step 2: confirms the emailed code, creates the account and signs in. */
export async function verifySignUp(email: string, code: string): Promise<AuthUser> {
  return (await call<{ user: AuthUser }>("/auth/register/verify", { method: "POST", body: JSON.stringify({ email, code }) })).user;
}

export async function resendSignUpCode(email: string): Promise<CodeSent> {
  return call<CodeSent>("/auth/register/resend", { method: "POST", body: JSON.stringify({ email }) });
}

export async function logout(): Promise<void> {
  await call<void>("/auth/logout", { method: "POST" });
}

/** Full-page navigation to Google; the API sends the browser back to `returnTo` afterwards. */
export function googleSignInUrl(returnTo: string): string {
  return `/api/auth/google?${new URLSearchParams({ returnTo })}`;
}

/** Messages for the `?auth_error=` codes the API adds when Google sign-in fails. */
export function googleErrorMessage(code: string): string {
  switch (code) {
    case "google_cancelled": return "Google sign-in was cancelled.";
    case "google_conflict": return "This email is already linked to a different Google account.";
    case "google_unavailable": return "Google sign-in isn't set up yet. Use email and password instead.";
    case "google_state": return "Google sign-in took too long or was interrupted. Please try again.";
    default: return "Google sign-in didn't work. Please try again.";
  }
}
