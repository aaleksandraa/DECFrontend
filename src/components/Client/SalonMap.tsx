import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Star, Phone, Clock } from 'lucide-react';
import { Salon } from '../../types';
import { LocationService } from '../../utils/locationUtils';

interface SalonMapProps {
  salons: Salon[];
  selectedSalon?: Salon | null;
  onSalonSelect: (salon: Salon) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export function SalonMap({ salons, selectedSalon, onSalonSelect, userLocation }: SalonMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (isMapLoaded && salons.length > 0) {
      updateMarkers();
    }
  }, [salons, isMapLoaded]);

  useEffect(() => {
    if (selectedSalon && isMapLoaded) {
      focusOnSalon(selectedSalon);
    }
  }, [selectedSalon, isMapLoaded]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Default center (Belgrade)
    const defaultCenter = { lat: 44.8176, lng: 20.4633 };
    const center = userLocation || defaultCenter;

    const map = new google.maps.Map(mapRef.current, {
      zoom: userLocation ? 13 : 11,
      center: center,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Add user location marker if available
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Vaša lokacija',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });
    }

    setIsMapLoaded(true);
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers
    salons.forEach(salon => {
      if (!salon.location || salon.location.lat === 0 && salon.location.lng === 0) return;

      const marker = new google.maps.Marker({
        position: { lat: salon.location.lat, lng: salon.location.lng },
        map: mapInstanceRef.current,
        title: salon.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#8B5CF6"/>
              <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
              <path d="M16 10L18.5 15H22L19 18L20 23L16 20L12 23L13 18L10 15H13.5L16 10Z" fill="#8B5CF6"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 40)
        }
      });

      marker.addListener('click', () => {
        onSalonSelect(salon);
        showInfoWindow(marker, salon);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      mapInstanceRef.current!.fitBounds(bounds);
      
      // Don't zoom in too much if there's only one salon
      if (markersRef.current.length === 1) {
        mapInstanceRef.current!.setZoom(15);
      }
    }
  };

  const showInfoWindow = (marker: google.maps.Marker, salon: Salon) => {
    if (!infoWindowRef.current) return;

    const distance = userLocation && salon.location
      ? LocationService.getInstance().calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          salon.location.lat, 
          salon.location.lng
        ).toFixed(1)
      : null;

    const content = `
      <div style="max-width: 300px; padding: 12px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1F2937;">
          ${salon.name}
        </h3>
        
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span style="font-size: 14px; color: #374151;">${salon.rating}/5 (${salon.review_count} recenzija)</span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B7280">
            <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.03 7.03 1 12 1S21 5.03 21 10Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style="font-size: 14px; color: #6B7280;">${salon.address}, ${salon.city}</span>
        </div>
        
        ${distance ? `
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; color: #059669; background: #D1FAE5; padding: 2px 6px; border-radius: 4px;">
              ${distance} km od vas
            </span>
          </div>
        ` : ''}
        
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B7280">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <span style="font-size: 14px; color: #6B7280;">
            ${salon.working_hours && salon.working_hours.monday ? 
              `${salon.working_hours.monday.is_open ? 
                `${salon.working_hours.monday.open}-${salon.working_hours.monday.close}` : 
                'Zatvoreno'
              }` : 'Radno vrijeme nije dostupno'
            }
          </span>
        </div>
        
        <button 
          onclick="window.selectSalonFromMap('${salon.id}')"
          style="
            width: 100%; 
            background: linear-gradient(to right, #3B82F6, #8B5CF6); 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            font-size: 14px; 
            font-weight: 500; 
            cursor: pointer;
          "
        >
          Rezerviši termin
        </button>
      </div>
    `;

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.open(mapInstanceRef.current, marker);
  };

  const focusOnSalon = (salon: Salon) => {
    if (!mapInstanceRef.current || !salon.location || salon.location.lat === 0) return;

    mapInstanceRef.current.setCenter({
      lat: salon.location.lat,
      lng: salon.location.lng
    });
    mapInstanceRef.current.setZoom(16);

    // Find and trigger click on the corresponding marker
    const marker = markersRef.current.find(m => {
      const pos = m.getPosition();
      return pos && 
        Math.abs(pos.lat() - salon.location.lat) < 0.0001 && 
        Math.abs(pos.lng() - salon.location.lng) < 0.0001;
    });

    if (marker) {
      showInfoWindow(marker, salon);
    }
  };

  // Global function for info window button clicks
  useEffect(() => {
    (window as any).selectSalonFromMap = (salonId: string) => {
      const salon = salons.find(s => s.id === salonId);
      if (salon) {
        onSalonSelect(salon);
      }
    };

    return () => {
      delete (window as any).selectSalonFromMap;
    };
  }, [salons, onSalonSelect]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-200"
        style={{ minHeight: '400px' }}
      />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Učitavanje mape...</p>
          </div>
        </div>
      )}
      
      {salons.length === 0 && isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Nema salona za prikaz</p>
          </div>
        </div>
      )}
    </div>
  );
}