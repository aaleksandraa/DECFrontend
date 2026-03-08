import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { publicSettingsAPI } from '../../services/api';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasAnalyticsConsent,
} from '../../utils/cookieConsent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

function clearGoogleAnalyticsCookies() {
  const cookieNames = document.cookie
    .split(';')
    .map((part) => part.split('=')[0]?.trim())
    .filter((name): name is string => Boolean(name))
    .filter(
      (name) =>
        name.startsWith('_ga') ||
        name.startsWith('_gid') ||
        name.startsWith('_gat')
    );

  cookieNames.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
  });
}

export function GoogleAnalytics() {
  const location = useLocation();
  const [gaId, setGaId] = useState<string | null>(null);
  const [analyticsAllowed, setAnalyticsAllowed] = useState<boolean>(() =>
    hasAnalyticsConsent()
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAnalyticsSettings = async () => {
      try {
        const settings = await publicSettingsAPI.getAnalyticsSettings();

        if (settings.google_analytics_enabled && settings.google_analytics_id) {
          const id = settings.google_analytics_id.trim();
          if (/^G-[A-Z0-9]+$/i.test(id) || /^UA-\d+-\d+$/i.test(id)) {
            setGaId(id);
          }
        }
      } catch (error) {
        console.debug('[GA] Failed to load analytics settings', error);
      }
    };

    loadAnalyticsSettings();
  }, []);

  useEffect(() => {
    const handleConsentUpdate = () => {
      setAnalyticsAllowed(hasAnalyticsConsent());
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleConsentUpdate);
    return () => {
      window.removeEventListener(
        COOKIE_CONSENT_UPDATED_EVENT,
        handleConsentUpdate
      );
    };
  }, []);

  useEffect(() => {
    if (!gaId || analyticsAllowed) return;

    window[`ga-disable-${gaId}`] = true;

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }

    const injectedScript = document.querySelector(
      `script[data-frizerino-ga="${gaId}"]`
    );

    if (injectedScript?.parentNode) {
      injectedScript.parentNode.removeChild(injectedScript);
    }

    clearGoogleAnalyticsCookies();
    setIsLoaded(false);
  }, [gaId, analyticsAllowed]);

  useEffect(() => {
    if (!gaId || !analyticsAllowed) return;

    window[`ga-disable-${gaId}`] = false;
    window.dataLayer = window.dataLayer || [];

    const staleScripts = document.querySelectorAll(
      `script[data-frizerino-ga]:not([data-frizerino-ga="${gaId}"])`
    );
    staleScripts.forEach((script) => script.parentNode?.removeChild(script));

    if (typeof window.gtag !== 'function') {
      window.gtag = (...args: unknown[]) => {
        window.dataLayer.push(args);
      };
    }

    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    window.gtag('js', new Date());
    window.gtag('config', gaId, {
      send_page_view: false,
    });

    const existingScript = document.querySelector(
      `script[data-frizerino-ga="${gaId}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.dataset.frizerinoGa = gaId;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('[GA] Failed to load Google Analytics script');
    };

    document.head.appendChild(script);
  }, [gaId, analyticsAllowed]);

  useEffect(() => {
    if (!gaId || !analyticsAllowed || !isLoaded || typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}${location.hash}`,
    });
  }, [
    gaId,
    analyticsAllowed,
    isLoaded,
    location.pathname,
    location.search,
    location.hash,
  ]);

  return null;
}

export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
) {
  if (
    typeof window !== 'undefined' &&
    typeof window.gtag === 'function' &&
    hasAnalyticsConsent()
  ) {
    window.gtag('event', eventName, eventParams ?? {});
  }
}

export const analyticsEvents = {
  bookingStarted: (salonId: string, salonName: string) =>
    trackEvent('booking_started', { salon_id: salonId, salon_name: salonName }),

  bookingCompleted: (
    salonId: string,
    salonName: string,
    serviceId: string,
    serviceName: string
  ) =>
    trackEvent('booking_completed', {
      salon_id: salonId,
      salon_name: salonName,
      service_id: serviceId,
      service_name: serviceName,
    }),

  bookingCancelled: (appointmentId: string) =>
    trackEvent('booking_cancelled', { appointment_id: appointmentId }),

  searchPerformed: (query: string, city?: string, resultsCount?: number) =>
    trackEvent('search', {
      search_term: query,
      city,
      results_count: resultsCount,
    }),

  salonViewed: (salonId: string, salonName: string, city: string) =>
    trackEvent('salon_viewed', {
      salon_id: salonId,
      salon_name: salonName,
      city,
    }),

  userRegistered: (userType: string) =>
    trackEvent('user_registered', { user_type: userType }),

  userLoggedIn: (userType: string) =>
    trackEvent('user_logged_in', { user_type: userType }),

  contactFormSubmitted: () => trackEvent('contact_form_submitted'),
};
