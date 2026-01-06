// PublicSearchV2.tsx - Version 2 with expanded filters
// This is a simplified version focusing on the filter changes
// Full implementation would copy all code from PublicSearchV1.tsx and modify the filter section

import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicAPI, locationsAPI, publicSettingsAPI, favoriteAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppearance } from '../../context/AppearanceContext';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  StarIcon,
  XMarkIcon,
  ListBulletIcon,
  MapIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowsUpDownIcon,
  HeartIcon,
  ScissorsIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { LoginPromptModal } from '../Common/LoginPromptModal';

// Lazy load map component
const SalonsMapView = lazy(() => import('./SalonsMapView'));

// NOTE: This file contains only the key changes for V2
// In production, copy entire PublicSearchV1.tsx and apply these changes

interface Salon {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  description: string;
  image_url?: string | null;
  cover_image_url?: string | null;
  images?: Array<{ id: number; url: string; is_primary: boolean }>;
  average_rating?: number;
  rating?: number;
  reviews_count?: number;
  review_count?: number;
  target_audience?: string | { women?: boolean; men?: boolean; children?: boolean };
  latitude?: number;
  longitude?: number;
  location?: { lat: number; lng: number };
  distance?: number;
  working_hours?: {
    [key: string]: { open: string; close: string; is_open: boolean };
  };
}

interface SearchFilters {
  q: string;
  city: string;
  service: string;
  min_rating: string;
  audience: string;
  date: string;
  time: string;
}

// Time slots for availability filter
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Sort options
const sortOptions = [
  { value: 'rating', label: 'Ocjena', icon: StarIcon },
  { value: 'reviews', label: 'Broj recenzija', icon: UserGroupIcon },
  { value: 'name', label: 'Naziv', icon: ListBulletIcon },
  { value: 'distance', label: 'Udaljenost', icon: MapPinIcon },
];

export const PublicSearchV2: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const { heroBackgroundImage } = useAppearance();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // View mode: list or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // Service autocomplete - NEW FOR V2
  const [serviceQuery, setServiceQuery] = useState('');
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceInputRef = useRef<HTMLDivElement>(null);
  
  // City autocomplete
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [cityLocations, setCityLocations] = useState<any[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    service: searchParams.get('service') || '',
    min_rating: searchParams.get('min_rating') || '',
    audience: searchParams.get('audience') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
  });

  // Fetch available services for autocomplete - NEW FOR V2
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await publicAPI.getPopularServices();
        const services = (response.services || []).map((s: any) => s.name);
        setAvailableServices(services);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

  // Filter services based on query - NEW FOR V2
  const filteredServices = availableServices.filter(service =>
    service.toLowerCase().includes(serviceQuery.toLowerCase())
  ).slice(0, 10);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (serviceInputRef.current && !serviceInputRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
    });
    setSearchParams(newParams);
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  // TODO: Copy all other functions from PublicSearchV1.tsx
  // Including: search logic, sorting, distance calculation, etc.

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      {/* Hero Section - Simplified for V2 */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
            Pronađite i rezervišite salon online
          </h1>
        </div>
      </div>

      {/* EXPANDED FILTERS SECTION - KEY CHANGE FOR V2 */}
      <div className="bg-white border-b shadow-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          
          {/* Desktop Filters - Always Visible */}
          <div className="hidden md:block">
            <div className="grid grid-cols-12 gap-3 mb-3">
              {/* City Filter */}
              <div className="col-span-3 relative" ref={cityInputRef}>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Grad"
                    value={citySearchQuery}
                    onChange={(e) => {
                      setCitySearchQuery(e.target.value);
                      setShowCityDropdown(true);
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  {citySearchQuery && (
                    <button
                      onClick={() => {
                        setCitySearchQuery('');
                        handleFilterChange('city', '');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {showCityDropdown && cityLocations.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {cityLocations.slice(0, 15).map((location) => (
                      <button
                        key={location.id}
                        onClick={() => {
                          setCitySearchQuery(location.name);
                          handleFilterChange('city', location.name);
                          setShowCityDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-pink-50 text-sm"
                      >
                        {location.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Filter - NEW AUTOCOMPLETE */}
              <div className="col-span-3 relative" ref={serviceInputRef}>
                <div className="relative">
                  <ScissorsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                  <input
                    type="text"
                    placeholder="Usluga"
                    value={serviceQuery}
                    onChange={(e) => {
                      setServiceQuery(e.target.value);
                      setShowServiceDropdown(true);
                    }}
                    onFocus={() => setShowServiceDropdown(true)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                  {serviceQuery && (
                    <button
                      onClick={() => {
                        setServiceQuery('');
                        handleFilterChange('service', '');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                {showServiceDropdown && filteredServices.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredServices.map((service, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setServiceQuery(service);
                          handleFilterChange('service', service);
                          setShowServiceDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-pink-50 text-sm"
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Filter */}
              <div className="col-span-2">
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    min={today}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Time Filter */}
              <div className="col-span-2">
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <select
                    value={filters.time}
                    onChange={(e) => handleFilterChange('time', e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none"
                  >
                    <option value="">Vrijeme</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Gender Filters - Toggle Buttons */}
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={() => handleFilterChange('audience', filters.audience === 'men' ? '' : 'men')}
                  className={`flex-1 px-3 py-2.5 rounded-lg border-2 font-medium transition-all ${
                    filters.audience === 'men'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300'
                  }`}
                  title="Muški"
                >
                  M
                </button>
                <button
                  onClick={() => handleFilterChange('audience', filters.audience === 'women' ? '' : 'women')}
                  className={`flex-1 px-3 py-2.5 rounded-lg border-2 font-medium transition-all ${
                    filters.audience === 'women'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-300 text-gray-600 hover:border-pink-300'
                  }`}
                  title="Ženski"
                >
                  Ž
                </button>
                <button
                  onClick={() => handleFilterChange('audience', filters.audience === 'children' ? '' : 'children')}
                  className={`flex-1 px-3 py-2.5 rounded-lg border-2 font-medium transition-all ${
                    filters.audience === 'children'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-300 text-gray-600 hover:border-yellow-300'
                  }`}
                  title="Dječiji"
                >
                  D
                </button>
              </div>
            </div>

            {/* Second Row - View Mode and Sort */}
            <div className="flex items-center justify-between">
              {/* View Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    viewMode === 'map'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <MapIcon className="h-5 w-5" />
                  <span>Mapa</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ArrowsUpDownIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">Sortiraj</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-pink-50 flex items-center gap-3"
                      >
                        <option.icon className="h-5 w-5 text-gray-400" />
                        <span className={sortBy === option.value ? 'text-pink-600 font-medium' : 'text-gray-700'}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Filters - Vertical Stack */}
          <div className="md:hidden space-y-3">
            {/* City */}
            <div className="relative" ref={cityInputRef}>
              <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Grad"
                value={citySearchQuery}
                onChange={(e) => {
                  setCitySearchQuery(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              {showCityDropdown && cityLocations.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {cityLocations.slice(0, 15).map((location) => (
                    <button
                      key={location.id}
                      onClick={() => {
                        setCitySearchQuery(location.name);
                        handleFilterChange('city', location.name);
                        setShowCityDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-pink-50"
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service */}
            <div className="relative" ref={serviceInputRef}>
              <ScissorsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Usluga"
                value={serviceQuery}
                onChange={(e) => {
                  setServiceQuery(e.target.value);
                  setShowServiceDropdown(true);
                }}
                onFocus={() => setShowServiceDropdown(true)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              {showServiceDropdown && filteredServices.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredServices.map((service, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setServiceQuery(service);
                        handleFilterChange('service', service);
                        setShowServiceDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-pink-50"
                    >
                      {service}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date and Time - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  min={today}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <select
                  value={filters.time}
                  onChange={(e) => handleFilterChange('time', e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none"
                >
                  <option value="">Vrijeme</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Gender Filters - Full Width Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleFilterChange('audience', filters.audience === 'men' ? '' : 'men')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  filters.audience === 'men'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                Muškarci
              </button>
              <button
                onClick={() => handleFilterChange('audience', filters.audience === 'women' ? '' : 'women')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  filters.audience === 'women'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                Žene
              </button>
              <button
                onClick={() => handleFilterChange('audience', filters.audience === 'children' ? '' : 'children')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  filters.audience === 'children'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                Djeca
              </button>
            </div>

            {/* View Mode and Sort - Mobile */}
            <div className="flex items-center gap-2">
              {/* Sort - Icon Only */}
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Sortiraj"
              >
                <ArrowsUpDownIcon className="h-5 w-5 text-gray-600" />
              </button>

              {/* View Toggle */}
              <div className="flex-1 flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    viewMode === 'map'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <MapIcon className="h-5 w-5" />
                  <span>Mapa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16">
            <p className="text-gray-500">
              Ovo je PublicSearchV2 - verzija sa raspakovanim filterima.
            </p>
            <p className="text-gray-500 mt-2">
              Za kompletnu implementaciju, kopirajte cijeli kod iz PublicSearchV1.tsx
              i zamijenite filter sekciju sa ovim kodom.
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
      
      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={false}
        onClose={() => {}}
      />
    </div>
  );
};

export default PublicSearchV2;
