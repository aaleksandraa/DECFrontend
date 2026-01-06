import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { MapPinIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useEffect } from 'react';

// Custom salon marker icon
const salonIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// User location marker (blue)
const userIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

interface Salon {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  location?: { lat: number; lng: number };
  average_rating?: number;
  rating?: number;
  reviews_count?: number;
  review_count?: number;
  cover_image_url?: string | null;
  image_url?: string | null;
  images?: Array<{ id: number; url: string; is_primary: boolean }>;
}

interface SalonsMapViewProps {
  salons: Salon[];
  userLocation?: { lat: number; lng: number } | null;
  onSalonClick?: (salon: Salon) => void;
}

// Component to fit bounds when salons change
function FitBounds({ salons, userLocation }: { salons: Salon[]; userLocation?: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    
    // Add salon locations
    salons.forEach(salon => {
      const lat = salon.latitude || salon.location?.lat;
      const lng = salon.longitude || salon.location?.lng;
      if (lat && lng) {
        points.push([lat, lng]);
      }
    });

    // Add user location if available
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    if (points.length > 0) {
      const bounds = new LatLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [salons, userLocation, map]);

  return null;
}

export default function SalonsMapView({ salons, userLocation, onSalonClick }: SalonsMapViewProps) {

  // Filter salons with valid coordinates
  const salonsWithCoords = salons.filter(salon => {
    const lat = salon.latitude || salon.location?.lat;
    const lng = salon.longitude || salon.location?.lng;
    return lat && lng;
  });

  // Default center (Bosnia & Herzegovina)
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [43.8563, 18.4131]; // Sarajevo

  const getDistance = (salon: Salon): number | null => {
    if (!userLocation) return null;
    const lat = salon.latitude || salon.location?.lat;
    const lng = salon.longitude || salon.location?.lng;
    if (!lat || !lng) return null;
    
    const R = 6371;
    const dLat = (lat - userLocation.lat) * Math.PI / 180;
    const dLon = (lng - userLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (salonsWithCoords.length === 0 && !userLocation) {
    return (
      <div className="h-[600px] rounded-xl overflow-hidden shadow-lg bg-gray-100 flex flex-col items-center justify-center">
        <MapPinIcon className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg font-medium mb-2">Nema salona sa lokacijom</p>
        <p className="text-gray-500 text-sm">Saloni trebaju unijeti koordinate u podešavanjima</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] rounded-xl overflow-hidden shadow-lg relative">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds salons={salonsWithCoords} userLocation={userLocation} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-semibold text-blue-600">Vaša lokacija</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Salon markers */}
        {salonsWithCoords.map(salon => {
          const lat = salon.latitude || salon.location?.lat;
          const lng = salon.longitude || salon.location?.lng;
          if (!lat || !lng) return null;

          const rating = salon.average_rating || salon.rating || 0;
          const reviewCount = salon.reviews_count || salon.review_count || 0;
          const distance = getDistance(salon);
          const image = salon.images?.find(img => img.is_primary)?.url || 
                       salon.images?.[0]?.url || 
                       salon.cover_image_url || 
                       salon.image_url;

          return (
            <Marker
              key={salon.id}
              position={[lat, lng]}
              icon={salonIcon}
              eventHandlers={{
                click: () => {
                  if (onSalonClick) onSalonClick(salon);
                }
              }}
            >
              <Popup>
                <div className="w-64 p-0">
                  {/* Salon Image */}
                  {image && (
                    <div className="relative h-32 -mx-3 -mt-3 mb-3">
                      <img
                        src={image}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                      />
                      {rating > 0 && (
                        <div className="absolute top-2 right-2 bg-yellow-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <StarSolid className="h-3 w-3 text-white" />
                          <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Salon Info */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 text-base">{salon.name}</h3>
                    
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                      {salon.address}, {salon.city}
                    </p>

                    {distance !== null && (
                      <p className="text-sm text-blue-600 font-medium">
                        📍 {distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`} od vas
                      </p>
                    )}

                    {rating > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            star <= Math.round(rating) ? (
                              <StarSolid key={star} className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <StarIcon key={star} className="w-4 h-4 text-gray-300" />
                            )
                          ))}
                        </div>
                        <span className="text-gray-500">({reviewCount})</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link
                        to={`/salon/${salon.slug}`}
                        className="flex-1 text-center py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Pogledaj salon
                      </Link>
                      <button
                        onClick={() => {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                        }}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Otvori navigaciju"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <p className="text-xs font-semibold text-gray-700 mb-2">Legenda</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
            <span>Vaša lokacija</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-3 h-5 bg-orange-500 rounded-t-full"></div>
            <span>Salon ({salonsWithCoords.length})</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 z-[1000]">
        <p className="text-sm font-medium text-gray-700">
          {salonsWithCoords.length} {salonsWithCoords.length === 1 ? 'salon' : 'salona'} na mapi
        </p>
      </div>
    </div>
  );
}
