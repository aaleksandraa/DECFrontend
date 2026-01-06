import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

// Custom orange marker icon
const salonMarkerIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="48">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12z" fill="#EA580C"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
});

interface SalonLocationMapProps {
  latitude: number;
  longitude: number;
  salonName: string;
  address: string;
  googleMapsUrl?: string | null;
}

export default function SalonLocationMap({
  latitude,
  longitude,
  salonName,
  address,
  googleMapsUrl
}: SalonLocationMapProps) {
  const position: [number, number] = [latitude, longitude];

  const handleOpenDirections = () => {
    if (googleMapsUrl) {
      window.open(googleMapsUrl, '_blank');
    } else {
      // Fallback to Google Maps with coordinates
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-orange-600" />
          Lokacija
        </h3>
        <button
          onClick={handleOpenDirections}
          className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          Vodi me do lokacije
        </button>
      </div>
      
      <div className="h-64 md:h-80">
        <MapContainer
          center={position}
          zoom={17}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={salonMarkerIcon}>
            <Popup>
              <div className="text-center p-1">
                <strong className="block text-gray-900 font-semibold">{salonName}</strong>
                <span className="text-sm text-gray-600">{address}</span>
                <button
                  onClick={handleOpenDirections}
                  className="mt-2 w-full py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Otvori navigaciju
                </button>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      
      <div className="p-4 bg-gray-50 border-t space-y-3">
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          {address}
        </p>
        <button
          onClick={handleOpenDirections}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
        >
          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
          Otvori u navigaciji
        </button>
      </div>
    </div>
  );
}
