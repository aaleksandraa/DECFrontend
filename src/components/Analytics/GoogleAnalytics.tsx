import { useEffect, useState } from 'react';
import { publicSettingsAPI } from '../../services/api';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAnalyticsSettings = async () => {
      try {
        const settings = await publicSettingsAPI.getAnalyticsSettings();
        console.debug('[GA] Settings loaded:', settings);
        
        if (settings.google_analytics_enabled && settings.google_analytics_id) {
          const id = settings.google_analytics_id.trim();
          // Validate GA4 format (G-XXXXXXXXXX) or UA format (UA-XXXXX-X)
          if (/^G-[A-Z0-9]+$/i.test(id) || /^UA-\d+-\d+$/i.test(id)) {
            setGaId(id);
            console.debug('[GA] Valid ID set:', id);
          } else {
            console.warn('[GA] Invalid ID format:', id);
          }
        } else {
          console.debug('[GA] Analytics disabled or no ID configured');
        }
      } catch (error) {
        console.debug('[GA] Failed to load analytics settings:', error);
      }
    };

    loadAnalyticsSettings();
  }, []);

  useEffect(() => {
    if (!gaId || isLoaded) return;

    // Check if GA script is already loaded
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag"]`);
    if (existingScript) {
      console.debug('[GA] Script already exists, skipping injection');
      setIsLoaded(true);
      return;
    }

    console.debug('[GA] Injecting Google Analytics script for ID:', gaId);

    // Initialize dataLayer before script loads
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function - must push arguments as array (using 'arguments' object)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function gtag(..._args: any[]) {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Initialize gtag with timestamp
    window.gtag('js', new Date());

    // Create and load the GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    
    script.onload = () => {
      console.debug('[GA] Script loaded successfully');
      // Configure GA after script loads
      window.gtag('config', gaId, {
        page_title: document.title,
        page_location: window.location.href,
        send_page_view: true,
      });
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('[GA] Failed to load Google Analytics script');
    };

    document.head.appendChild(script);

    // Track page views on route changes
    const handleRouteChange = () => {
      if (window.gtag && gaId) {
        window.gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [gaId, isLoaded]);

  // This component doesn't render anything visible
  return null;
}

// Helper function to track events
export function trackEvent(
  eventName: string, 
  eventParams?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

// Pre-defined event helpers
export const analyticsEvents = {
  // Booking events
  bookingStarted: (salonId: string, salonName: string) => 
    trackEvent('booking_started', { salon_id: salonId, salon_name: salonName }),
  
  bookingCompleted: (salonId: string, salonName: string, serviceId: string, serviceName: string) =>
    trackEvent('booking_completed', { 
      salon_id: salonId, 
      salon_name: salonName,
      service_id: serviceId,
      service_name: serviceName 
    }),
  
  bookingCancelled: (appointmentId: string) =>
    trackEvent('booking_cancelled', { appointment_id: appointmentId }),

  // Search events
  searchPerformed: (query: string, city?: string, resultsCount?: number) =>
    trackEvent('search', { 
      search_term: query, 
      city: city,
      results_count: resultsCount 
    }),

  // Salon events
  salonViewed: (salonId: string, salonName: string, city: string) =>
    trackEvent('salon_viewed', { 
      salon_id: salonId, 
      salon_name: salonName,
      city: city 
    }),

  // User events
  userRegistered: (userType: string) =>
    trackEvent('user_registered', { user_type: userType }),

  userLoggedIn: (userType: string) =>
    trackEvent('user_logged_in', { user_type: userType }),

  // Contact events
  contactFormSubmitted: () =>
    trackEvent('contact_form_submitted'),
};
