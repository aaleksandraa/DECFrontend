import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GuestBookingModal } from '../components/Public/GuestBookingModal';
import { widgetAPI } from '../services/api';
import { Salon, Service, Staff } from '../types';

export const WidgetBooking: React.FC = () => {
  const { salonSlug } = useParams<{ salonSlug: string }>();
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get('key');
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [theme, setTheme] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadWidgetData();
  }, [salonSlug, apiKey]);
  
  // Apply theme to document
  useEffect(() => {
    if (theme.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    }
    if (theme.fontFamily) {
      document.documentElement.style.setProperty('--font-family', theme.fontFamily);
    }
  }, [theme]);
  
  const loadWidgetData = async () => {
    if (!apiKey || !salonSlug) {
      setError('API key i salon slug su obavezni');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await widgetAPI.getSalonWidget(salonSlug, apiKey);
      
      setSalon(response.salon);
      // CRITICAL: Ensure duration is a number for zero-duration validation
      const servicesWithNumericDuration = (response.services || []).map((service: any) => ({
        ...service,
        duration: Number(service.duration) || 0
      }));
      setServices(servicesWithNumericDuration);
      setStaff(response.staff || []);
      setTheme(response.theme || {});
    } catch (err: any) {
      console.error('Error loading widget data:', err);
      
      if (err?.response?.status === 401) {
        setError('Nevažeći API key');
      } else if (err?.response?.status === 403) {
        setError('Domen nije dozvoljen');
      } else if (err?.response?.status === 404) {
        setError('Salon nije pronađen');
      } else {
        setError('Greška pri učitavanju podataka');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }
  
  if (error || !salon) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Greška</h2>
          <p className="text-gray-600 mb-4">{error || 'Salon nije pronađen'}</p>
          <p className="text-sm text-gray-500">
            Molimo kontaktirajte salon za pomoć.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{
        fontFamily: theme.fontFamily || 'Inter, sans-serif',
      }}
    >
      {/* Widget Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">{salon.name}</h1>
          <p className="text-sm text-gray-600">{salon.city}</p>
        </div>
      </div>
      
      {/* Booking Modal (always open in widget) */}
      <div className="max-w-2xl mx-auto p-4">
        {/* DEBUG: Version indicator - REMOVE AFTER TESTING */}
        <div className="bg-yellow-100 border-2 border-yellow-500 p-3 rounded-lg mb-4 text-center">
          <p className="text-sm font-bold text-yellow-900">
            🔧 Widget Verzija: 2024-12-28-v4 (TEST)
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Ako vidiš ovu poruku, novi kod je učitan!
          </p>
        </div>
        
        <GuestBookingModal
          isOpen={true}
          onClose={() => {}} // No close in widget
          salon={{
            id: typeof salon.id === 'string' ? parseInt(salon.id) : salon.id,
            name: salon.name,
            slug: salon.slug,
            working_hours: salon.working_hours,
            salon_breaks: salon.salon_breaks,
            salon_vacations: salon.salon_vacations,
          }}
          services={services}
          staff={staff}
          user={null}
          isWidget={true}
        />
      </div>
      
      {/* Widget Footer */}
      <div className="bg-white border-t border-gray-200 py-3 px-4 mt-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <a 
              href="https://frizerino.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Frizerino
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WidgetBooking;