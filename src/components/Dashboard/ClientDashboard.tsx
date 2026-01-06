import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Star, 
  MapPin,
  Clock,
  Heart,
  TrendingUp,
  Navigation,
  Filter,
  Users,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Salon } from '../../types';
import { LocationService } from '../../utils/locationUtils';
import { salonAPI, appointmentAPI, favoriteAPI, publicAPI } from '../../services/api';

interface ClientDashboardProps {
  onBookingComplete?: () => void;
}

export function ClientDashboard({ onBookingComplete }: ClientDashboardProps) {
  const navigate = useNavigate();
  const [salonsWithAvailability, setSalonsWithAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    date: '',
    time: '',
    service: '',
    city: '',
    useCurrentLocation: false,
    audience: [] as string[]
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationService] = useState(() => LocationService.getInstance());
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<number | null>(null);
  const [cities, setCities] = useState<{name: string, slug: string}[]>([]);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalSpent: 0,
    favoriteSalons: 0
  });

  useEffect(() => {
    loadData();
    loadCities();
  }, []);

  // Auto-search when filters change (except text input which requires explicit submit)
  useEffect(() => {
    const hasActiveFilters = searchFilters.date || searchFilters.city || 
                             searchFilters.audience.length > 0 || searchFilters.useCurrentLocation;
    if (hasActiveFilters) {
      performSearch();
    }
  }, [searchFilters.date, searchFilters.city, searchFilters.audience, searchFilters.useCurrentLocation, userLocation]);

  const loadCities = async () => {
    try {
      const response = await publicAPI.getCities();
      // API returns { cities: [...], total: n }
      const citiesData = response?.cities || response || [];
      if (Array.isArray(citiesData)) {
        const cityList = citiesData.map((c: any) => ({
          name: c.name || c.city || '',
          slug: c.slug || c.city_slug || ''
        })).filter((c: any) => c.name && c.slug);
        setCities(cityList);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load salons with earliest availability
      const salonsData = await salonAPI.getSalons({
        order_by: 'rating',
        order_direction: 'desc',
        per_page: 6
      });
      setSalonsWithAvailability(salonsData);
      
      // Load upcoming appointments
      const appointmentsData = await appointmentAPI.getAppointments({
        type: 'upcoming',
        per_page: 3
      });
      // Sort upcoming appointments ascending (soonest first)
      const sortedAppointments = appointmentsData.sort((a: any, b: any) => {
        const dateA = new Date(a.date.split('.').reverse().join('-'));
        const dateB = new Date(b.date.split('.').reverse().join('-'));
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime(); // Ascending
        }
        
        return a.time.localeCompare(b.time);
      });
      setUpcomingAppointments(sortedAppointments);
      
      // Load favorites
      const favoritesData = await favoriteAPI.getFavorites();
      setFavorites(favoritesData.slice(0, 2));
      setFavoriteIds(new Set(favoritesData.map((s: any) => s.id)));
      
      // Calculate stats
      const allAppointments = await appointmentAPI.getAppointments();
      const completedAppointments = allAppointments.filter((app: any) => app.status === 'completed');
      
      setStats({
        totalAppointments: allAppointments.length,
        totalSpent: completedAppointments.reduce((sum: number, app: any) => sum + (app.total_price || 0), 0),
        favoriteSalons: favoritesData.length
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent, salonId: number) => {
    e.stopPropagation();
    
    setFavoriteLoading(salonId);
    try {
      if (favoriteIds.has(salonId)) {
        await favoriteAPI.removeFavorite(String(salonId));
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(salonId);
          return newSet;
        });
      } else {
        await favoriteAPI.addFavorite(String(salonId));
        setFavoriteIds(prev => new Set(prev).add(salonId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(null);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        setSearchFilters(prev => ({ ...prev, useCurrentLocation: true, city: '' }));
      }
    } catch (error: any) {
      console.error('Error getting user location:', error);
      setLocationError('Nije moguće dobiti lokaciju. Provjerite da li ste dozvolili pristup lokaciji.');
      setSearchFilters(prev => ({ ...prev, useCurrentLocation: false }));
    } finally {
      setLocationLoading(false);
    }
  };

  const toggleAudience = (audience: string) => {
    setSearchFilters(prev => ({
      ...prev,
      audience: prev.audience.includes(audience)
        ? prev.audience.filter(a => a !== audience)
        : [...prev.audience, audience]
    }));
  };

  const performSearch = async () => {
    setSearchLoading(true);
    setHasSearched(true);
    
    try {
      const params: any = {
        per_page: 20
      };
      
      if (searchFilters.date) {
        params.date = searchFilters.date;
      }
      
      if (searchFilters.time) {
        params.time = searchFilters.time;
      }
      
      if (searchFilters.service) {
        params.q = searchFilters.service;
      }
      
      if (searchFilters.audience.length > 0) {
        params.audience = searchFilters.audience;
      }
      
      if (userLocation && searchFilters.useCurrentLocation) {
        params.latitude = userLocation.lat;
        params.longitude = userLocation.lng;
        params.radius = 15; // 15km radius
      } else if (searchFilters.city) {
        params.city = searchFilters.city;
      }
      
      const response = await publicAPI.search(params);
      // API returns { salons: [...], filters: {...} }
      // Extract salons array from response
      let results: any[] = [];
      if (response?.salons) {
        results = Array.isArray(response.salons) ? response.salons : [];
      } else if (response?.data?.salons) {
        results = Array.isArray(response.data.salons) ? response.data.salons : [];
      } else if (Array.isArray(response?.data)) {
        results = response.data;
      } else if (Array.isArray(response)) {
        results = response;
      }
      
      // Add distance information if we have user location
      if (userLocation && searchFilters.useCurrentLocation && results.length > 0) {
        results = results.map((salon: any) => {
          if (salon.location?.lat && salon.location?.lng) {
            const distance = locationService.calculateDistance(
              userLocation.lat, userLocation.lng, salon.location.lat, salon.location.lng
            );
            return { ...salon, distance: `${distance.toFixed(1)} km` };
          }
          return salon;
        });
        
        // Sort by distance
        results.sort((a: any, b: any) => {
          const distA = parseFloat(a.distance) || 999;
          const distB = parseFloat(b.distance) || 999;
          return distA - distB;
        });
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchFilters({
      date: '',
      time: '',
      service: '',
      city: '',
      useCurrentLocation: false,
      audience: []
    });
    setSearchResults([]);
    setHasSearched(false);
    setUserLocation(null);
    setLocationError(null);
  };

  const handleSalonClick = (salon: any) => {
    navigate(`/salon/${salon.slug || salon.id}`);
  };

  // Format date for display (European format: DD.MM.YYYY)
  const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}.${year}`;
  };

  // Format time for display (24h format)
  const formatTimeForDisplay = (time: string): string => {
    return time; // Already in 24h format from input type="time"
  };

  const quickStats = [
    {
      label: 'Ukupno termina',
      value: stats.totalAppointments.toString(),
      subtitle: 'Ove godine',
      icon: Calendar,
      color: 'blue'
    },
    {
      label: 'Omiljeni saloni',
      value: stats.favoriteSalons.toString(),
      subtitle: 'Dodano u favorite',
      icon: Heart,
      color: 'red'
    },
    {
      label: 'Potrošeno',
      value: `${stats.totalSpent} KM`,
      subtitle: 'Ove godine',
      icon: TrendingUp,
      color: 'green'
    }
  ];

  const audienceOptions = [
    { value: 'women', label: 'Žene' },
    { value: 'men', label: 'Muškarci' },
    { value: 'children', label: 'Djeca' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Header with Search */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-6 md:p-8 text-white">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Dobrodošli nazad!</h1>
        <p className="text-orange-100 mb-4 sm:mb-6 text-sm sm:text-base">Pronađite i rezervišite termin u vašem omiljenom salonu</p>
        
        {/* Search Form */}
        <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pronađi salone</h3>
          </div>
          
          {/* Main Search Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-orange-100 mb-1">
                Datum
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={searchFilters.date}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm"
                />
              </div>
              {searchFilters.date && (
                <p className="text-xs text-orange-200 mt-1">
                  {formatDateForDisplay(searchFilters.date)}
                </p>
              )}
            </div>
            
            {/* Time Input (24h) */}
            <div>
              <label className="block text-sm font-medium text-orange-100 mb-1">
                Vrijeme
              </label>
              <input
                type="time"
                value={searchFilters.time}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm"
              />
            </div>
            
            {/* Service/Search Input */}
            <div>
              <label className="block text-sm font-medium text-orange-100 mb-1">
                Usluga
              </label>
              <input
                type="text"
                value={searchFilters.service}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, service: e.target.value }))}
                placeholder="Šišanje, farbanje..."
                className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm"
              />
            </div>
            
            {/* City Selection or Near Me */}
            <div>
              <label className="block text-sm font-medium text-orange-100 mb-1">
                Lokacija
              </label>
              <div className="flex gap-2">
                <select
                  value={searchFilters.city}
                  onChange={(e) => setSearchFilters(prev => ({ 
                    ...prev, 
                    city: e.target.value,
                    useCurrentLocation: false 
                  }))}
                  disabled={searchFilters.useCurrentLocation}
                  className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm disabled:bg-gray-200"
                >
                  <option value="">Svi gradovi</option>
                  {cities.map((city) => (
                    <option key={city.slug} value={city.slug}>{city.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Audience Filter & Near Me */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Audience Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-orange-100">Za:</span>
              {audienceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleAudience(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    searchFilters.audience.includes(option.value)
                      ? 'bg-white text-orange-600'
                      : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-orange-300 opacity-50" />
            
            {/* Near Me Button */}
            <button
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                searchFilters.useCurrentLocation
                  ? 'bg-white text-orange-600'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              {locationLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {searchFilters.useCurrentLocation ? 'Blizu mene ✓' : 'Prikaži blizu mene'}
            </button>
          </div>
          
          {/* Location Error */}
          {locationError && (
            <div className="mb-4 p-2 bg-red-500 bg-opacity-20 rounded-lg text-sm text-white">
              {locationError}
            </div>
          )}
          
          {/* Search Button */}
          <div className="flex gap-3">
            <button 
              onClick={performSearch}
              disabled={searchLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors text-sm sm:text-base font-medium disabled:opacity-50"
            >
              {searchLoading ? (
                <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Pretraži salone
            </button>
            
            {hasSearched && (
              <button 
                onClick={clearSearch}
                className="flex items-center justify-center gap-2 bg-white bg-opacity-20 px-4 py-3 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Očisti
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rezultati pretrage</h3>
                <p className="text-sm text-gray-600">
                  {searchLoading ? 'Pretraga...' : `Pronađeno ${Array.isArray(searchResults) ? searchResults.length : 0} salona`}
                  {searchFilters.date && ` za ${formatDateForDisplay(searchFilters.date)}`}
                  {searchFilters.time && ` u ${searchFilters.time}h`}
                  {searchFilters.useCurrentLocation && userLocation && ' blizu vas'}
                  {searchFilters.city && ` u gradu ${cities.find(c => c.slug === searchFilters.city)?.name || searchFilters.city}`}
                </p>
              </div>
              <button
                onClick={clearSearch}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Očisti pretragu
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {searchLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Pretraga salona...</p>
                </div>
              </div>
            ) : !Array.isArray(searchResults) || searchResults.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nema pronađenih salona za zadane kriterije</p>
                <p className="text-sm text-gray-400 mt-1">Pokušajte promijeniti filtere pretrage</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {(searchResults || []).map((salon) => (
                  <div 
                    key={salon.id} 
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleSalonClick(salon)}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={salon.images && salon.images.length > 0 ? salon.images[0].url : 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg'}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg';
                        }}
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <div className="bg-white px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{salon.rating || '0.0'}</span>
                        </div>
                        {/* Favorite Heart Button */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, salon.id)}
                          disabled={favoriteLoading === salon.id}
                          className="bg-white p-1.5 rounded-full hover:bg-red-50 transition-all disabled:opacity-50"
                          title={favoriteIds.has(salon.id) ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
                        >
                          {favoriteLoading === salon.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : favoriteIds.has(salon.id) ? (
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                          ) : (
                            <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                          )}
                        </button>
                      </div>
                      {salon.distance && (
                        <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {salon.distance}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">{salon.name}</h4>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{salon.address}, {salon.city}</span>
                      </div>
                      
                      {/* Audience Tags */}
                      {salon.target_audience && salon.target_audience.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {salon.target_audience.map((audience: string) => (
                            <span 
                              key={audience}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"
                            >
                              {audience === 'women' && 'Žene'}
                              {audience === 'men' && 'Muškarci'}
                              {audience === 'children' && 'Djeca'}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSalonClick(salon);
                        }}
                        className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-all text-sm font-medium"
                      >
                        Pogledaj salon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{stat.subtitle}</p>
                </div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'red' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'red' ? 'text-red-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Salons (when no search) */}
      {!hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <Star className="w-3 h-3 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Popularni saloni</h3>
                </div>
                <p className="text-sm text-gray-600">Najbolje ocijenjeni saloni</p>
              </div>
              <button 
                onClick={() => navigate('/pretraga')}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Pogledaj sve
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Učitavanje salona...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {salonsWithAvailability.map((salon) => (
                  <div 
                    key={salon.id} 
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleSalonClick(salon)}
                  >
                    <div className="aspect-video relative">
                      <img
                        src={salon.images && salon.images.length > 0 ? salon.images[0].url : 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg'}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg';
                        }}
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <div className="bg-white px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{salon.rating || '0.0'}</span>
                        </div>
                        {/* Favorite Heart Button */}
                        <button
                          onClick={(e) => handleToggleFavorite(e, salon.id)}
                          disabled={favoriteLoading === salon.id}
                          className="bg-white p-1.5 rounded-full hover:bg-red-50 transition-all disabled:opacity-50"
                          title={favoriteIds.has(salon.id) ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
                        >
                          {favoriteLoading === salon.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : favoriteIds.has(salon.id) ? (
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                          ) : (
                            <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">{salon.name}</h4>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{salon.address}, {salon.city}</span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSalonClick(salon);
                        }}
                        className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-all text-sm font-medium"
                      >
                        Pogledaj salon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nadolazeći termini</h3>
              <button 
                onClick={() => navigate('/moji-termini')}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Pogledaj sve
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment, index) => (
                    <div key={index} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate pr-2">{appointment.salon?.name}</h4>
                        <span className="text-sm text-gray-500 flex-shrink-0">{appointment.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{appointment.service?.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <span className="truncate">sa {appointment.staff?.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nema nadolazećih termina</p>
                  <button 
                    onClick={() => performSearch()}
                    className="mt-3 text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Pronađite salon
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Favorite Salons */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Omiljeni saloni</h3>
              <button 
                onClick={() => navigate('/omiljeni-saloni')}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Pogledaj sve
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              favorites.length > 0 ? (
                <div className="space-y-4">
                  {favorites.map((salon, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSalonClick(salon)}
                    >
                      <img
                        src={salon.images && salon.images.length > 0 ? salon.images[0].url : 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg'}
                        alt={salon.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{salon.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{salon.address}, {salon.city}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{salon.rating || '0.0'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nema omiljenih salona</p>
                  <button 
                    onClick={() => performSearch()}
                    className="mt-3 text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Istražite salone
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
