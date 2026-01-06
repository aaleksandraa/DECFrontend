import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Filter, Map, List, Navigation, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Salon, Service, Staff } from '../../types';
import { LocationService } from '../../utils/locationUtils';
import { SalonMap } from './SalonMap';
import { useAuth } from '../../context/AuthContext';
import { salonAPI, serviceAPI } from '../../services/api';

export function SalonSearchWithMap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [targetAudience, setTargetAudience] = useState({
    women: false,
    men: false,
    children: false
  });
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationService] = useState(() => LocationService.getInstance());
  const [cities, setCities] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);

  useEffect(() => {
    loadSalons();
    getCurrentLocation();
    loadCities();
    loadServiceCategories();
  }, []);

  useEffect(() => {
    filterSalons();
  }, [searchTerm, selectedCity, selectedService, targetAudience, salons, userLocation]);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const response = await salonAPI.getSalons();
      setSalons(response);
      setFilteredSalons(response);
    } catch (error) {
      console.error('Error loading salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll extract unique cities from the salons
      const response = await salonAPI.getSalons();
      const uniqueCities = [...new Set(response.map((salon: Salon) => salon.city))];
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadServiceCategories = async () => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll use hardcoded categories
      setServiceCategories(['Šišanje', 'Farbanje', 'Njega', 'Styling', 'Tretmani']);
    } catch (error) {
      console.error('Error loading service categories:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  const filterSalons = async () => {
    try {
      const params: any = {};
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (selectedCity) {
        params.city = selectedCity;
      }
      
      if (selectedService) {
        params.service = selectedService;
      }
      
      // Target audience filter
      if (targetAudience.women || targetAudience.men || targetAudience.children) {
        params.target_audience = JSON.stringify(targetAudience);
      }
      
      // Location-based sorting
      if (userLocation) {
        params.latitude = userLocation.lat;
        params.longitude = userLocation.lng;
        params.radius = 50; // 50km radius
      }
      
      const response = await salonAPI.getSalons(params);
      
      // Add distance information if we have user location
      if (userLocation) {
        response.forEach((salon: any) => {
          if (salon.location && salon.location.lat && salon.location.lng) {
            const distance = locationService.calculateDistance(
              userLocation.lat, userLocation.lng, salon.location.lat, salon.location.lng
            );
            salon.distance = `${distance.toFixed(1)} km`;
          }
        });
      }
      
      setFilteredSalons(response);
    } catch (error) {
      console.error('Error filtering salons:', error);
    }
  };

  const handleSalonSelect = (salon: Salon) => {
    setSelectedSalon(salon);
    navigate(`/salon/${salon.slug || salon.id}`);
  };

  const handleSalonClick = (salon: Salon) => {
    navigate(`/salon/${salon.slug || salon.id}`);
  };

  const handleBookAppointment = (salon: Salon) => {
    navigate(`/salon/${salon.slug || salon.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje salona...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Pronađite savršen salon</h1>
        <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base">Rezervišite termin u najboljem salonu u vašem gradu</p>
        
        {/* Search Bar */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Pretražite salone ili usluge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none text-sm sm:text-base"
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-8 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none appearance-none bg-white min-w-[150px] text-sm sm:text-base"
              >
                <option value="">Svi gradovi</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm sm:text-base"
            >
              <Filter className="w-5 h-5" />
              Filteri
            </button>

            {userLocation && (
              <button
                onClick={getCurrentLocation}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors text-sm sm:text-base"
              >
                <Navigation className="w-5 h-5" />
                Moja lokacija
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white bg-opacity-10 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tip usluge</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm"
                >
                  <option value="">Sve usluge</option>
                  {serviceCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ocena</label>
                <select className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm">
                  <option value="">Sve ocene</option>
                  <option value="4.5">4.5+ ⭐</option>
                  <option value="4.0">4.0+ ⭐</option>
                  <option value="3.5">3.5+ ⭐</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Za koga</label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={targetAudience.women}
                      onChange={(e) => setTargetAudience(prev => ({...prev, women: e.target.checked}))}
                      className="rounded text-white"
                    />
                    <span>Žene</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={targetAudience.men}
                      onChange={(e) => setTargetAudience(prev => ({...prev, men: e.target.checked}))}
                      className="rounded text-white"
                    />
                    <span>Muškarci</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={targetAudience.children}
                      onChange={(e) => setTargetAudience(prev => ({...prev, children: e.target.checked}))}
                      className="rounded text-white"
                    />
                    <span>Djeca</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Pronađeno {filteredSalons.length} salona</span>
          {userLocation && (
            <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Sortiran po udaljenosti
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'map' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map className="w-4 h-4" />
            Mapa
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        /* Salon List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalons.map(salon => {
            return (
              <div 
                key={salon.id} 
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleSalonClick(salon)}
              >
                <div className="relative h-48">
                  <img
                    src={salon.images && salon.images.length > 0 ? salon.images[0].url : 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg'}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg';
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{salon.rating || 'N/A'}</span>
                  </div>
                  {salon.distance && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {salon.distance}
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{salon.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{salon.address}, {salon.city}</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{salon.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {salon.working_hours.monday.is_open 
                          ? `${salon.working_hours.monday.open}-${salon.working_hours.monday.close}`
                          : 'Zatvoreno'
                        }
                      </span>
                    </div>
                    <span>{salon.review_count} recenzija</span>
                  </div>
                  
                  {salon.target_audience && (
                    <div className="flex gap-2 mb-4">
                      {salon.target_audience.women && (
                        <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Žene</span>
                      )}
                      {salon.target_audience.men && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Muškarci</span>
                      )}
                      {salon.target_audience.children && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Djeca</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSalonClick(salon);
                      }}
                      className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-all duration-200 font-medium"
                    >
                      Rezerviši termin
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSalon(salon);
                        if (viewMode === 'list') {
                          setViewMode('map');
                        }
                      }}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Map View */
        <SalonMap
          salons={filteredSalons}
          selectedSalon={selectedSalon}
          onSalonSelect={setSelectedSalon}
          userLocation={userLocation}
        />
      )}

      {filteredSalons.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nema rezultata</h3>
          <p className="text-gray-600">Pokušajte sa drugačijim kriterijumima pretrage</p>
        </div>
      )}
    </div>
  );
}