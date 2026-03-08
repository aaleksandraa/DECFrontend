export type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: 1;
};

const COOKIE_CONSENT_STORAGE_KEY = 'frizerino_cookie_preferences_v1';

export const COOKIE_SETTINGS_OPEN_EVENT = 'frizerino:open-cookie-settings';
export const COOKIE_CONSENT_UPDATED_EVENT = 'frizerino:cookie-consent-updated';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeCookieConsent(
  preferences: Partial<CookieConsentPreferences>
): CookieConsentPreferences {
  return {
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    updatedAt:
      typeof preferences.updatedAt === 'string' && preferences.updatedAt.length > 0
        ? preferences.updatedAt
        : new Date().toISOString(),
    version: 1,
  };
}

export function getCookieConsent(): CookieConsentPreferences | null {
  if (!isBrowser()) return null;

  const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    return normalizeCookieConsent(parsed);
  } catch {
    return null;
  }
}

export function saveCookieConsent(preferences: {
  analytics: boolean;
  marketing: boolean;
}): CookieConsentPreferences {
  const normalized = normalizeCookieConsent({
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    updatedAt: new Date().toISOString(),
  });

  if (isBrowser()) {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(
      new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: normalized })
    );
  }

  return normalized;
}

export function hasAnalyticsConsent(): boolean {
  return Boolean(getCookieConsent()?.analytics);
}

export function hasStoredCookieConsent(): boolean {
  return getCookieConsent() !== null;
}

export function openCookieSettings(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT));
}
