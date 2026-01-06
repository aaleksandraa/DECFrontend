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
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ListBulletIcon,
  MapIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowsUpDownIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { LoginPromptModal } from '../Common/LoginPromptModal';

// Lazy load map component
const SalonsMapView = lazy(() => import('./SalonsMapView'));

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

interface City {
  name: string;
  slug: string;
  salon_count: number;
  url: string;
  meta?: {
    title?: string;
    description?: string;
  };
}

interface PopularService {
  name: string;
  category: string;
  salon_count: number;
  min_price: number;
  max_price: number;
  search_name: string;
}

interface LocationItem {
  id: number;
  name: string;
  city_slug: string;
  entity: string;
  canton?: string;
  region?: string;
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

interface FilterBadgeProps {
  label: string;
  value: string;
  onClear: () => void;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ label, value, onClear }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
    <span className="font-medium">{label}:</span> {value}
    <button onClick={onClear} className="ml-1 hover:text-pink-900">
      <XMarkIcon className="h-4 w-4" />
    </button>
  </span>
);

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

export const PublicSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { heroBackgroundImage } = useAppearance();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Favorites state
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Refs to prevent double fetching in React StrictMode
  const fetchedRef = useRef({ appearance: false, services: false, topRated: false, cities: false, newest: false, menSalons: false, featured: false });
  
  // View mode: list or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // User location for distance calculation
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  
  // Popular services for tags
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Top rated salons for featured section
  const [topRatedSalons, setTopRatedSalons] = useState<Salon[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  
  // Newest salons section
  const [newestSalons, setNewestSalons] = useState<Salon[]>([]);
  const [newestLoading, setNewestLoading] = useState(true);
  
  // Men's barbers section
  const [menSalons, setMenSalons] = useState<Salon[]>([]);
  const [menSalonsLoading, setMenSalonsLoading] = useState(true);
  
  // Featured/Promoted salon (admin controlled)
  const [featuredSalon, setFeaturedSalon] = useState<Salon | null>(null);
  const [featuredSalonText, setFeaturedSalonText] = useState<string>('Otvoren je novi salon u vašem gradu');
  const [featuredSalonVisibility, setFeaturedSalonVisibility] = useState<'all' | 'location_only'>('all');
  const [featuredSalonLoading, setFeaturedSalonLoading] = useState(true);
  const [userLocationId, setUserLocationId] = useState<number | null>(null);
  const [showTopRated, setShowTopRated] = useState(true);
  const [showNewest, setShowNewest] = useState(true);
  
  // City autocomplete
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [cityLocations, setCityLocations] = useState<LocationItem[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchLoading, setCitySearchLoading] = useState(false);
  const cityInputRef = useRef<HTMLDivElement>(null);

  // Dynamic gradient from settings
  const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({
    background: 'linear-gradient(to bottom right, #f43f5e, #ec4899, #a855f7)'
  });

  // Track screen height for responsive service tags
  const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  // Update screen height on resize
  useEffect(() => {
    const handleResize = () => setScreenHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    service: searchParams.get('service') || '',
    min_rating: searchParams.get('min_rating') || '',
    audience: searchParams.get('audience') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
  });

  // Normalize text - remove Croatian diacritics for fuzzy search
  const normalizeText = (text: string): string => {
    const replacements: Record<string, string> = {
      'š': 's', 'Š': 'S',
      'č': 'c', 'Č': 'C',
      'ć': 'c', 'Ć': 'C',
      'ž': 'z', 'Ž': 'Z',
      'đ': 'd', 'Đ': 'D',
    };
    let result = text.toLowerCase();
    Object.entries(replacements).forEach(([from, to]) => {
      result = result.replace(new RegExp(from, 'g'), to);
    });
    return result;
  };

  // Filter suggestions based on search input
  const filteredSuggestions = popularServices.filter(service => {
    if (!filters.q || filters.q.length < 2) return false;
    const normalizedQuery = normalizeText(filters.q);
    const normalizedName = normalizeText(service.name);
    const normalizedCategory = normalizeText(service.category);
    return normalizedName.includes(normalizedQuery) || normalizedCategory.includes(normalizedQuery);
  }).slice(0, 6);

  // Get user's location for distance calculation
  const getUserLocation = useCallback((forNearMe: boolean = false) => {
    if (navigator.geolocation) {
      if (forNearMe) setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          if (forNearMe) {
            setNearMeActive(true);
            setSortBy('distance');
            setSortDirection('asc');
          }
          setLocationLoading(false);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setLocationLoading(false);
          if (forNearMe) {
            alert('Nije moguće dobiti vašu lokaciju. Provjerite da li je lokacija omogućena u pregledniku.');
          }
        }
      );
    }
  }, []);

  // Fetch appearance settings (gradient)
  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current.appearance) return;
    fetchedRef.current.appearance = true;
    
    const fetchAppearance = async () => {
      try {
        const response = await publicSettingsAPI.getAppearanceSettings();
        if (response.gradient) {
          const g = response.gradient;
          const directionMap: Record<string, string> = {
            'r': 'to right',
            'l': 'to left',
            't': 'to top',
            'b': 'to bottom',
            'tr': 'to top right',
            'tl': 'to top left',
            'br': 'to bottom right',
            'bl': 'to bottom left',
          };
          const dir = directionMap[g.direction] || 'to bottom right';
          const gradientCss = g.via 
            ? `linear-gradient(${dir}, ${g.from}, ${g.via}, ${g.to})`
            : `linear-gradient(${dir}, ${g.from}, ${g.to})`;
          setGradientStyle({ background: gradientCss });
        }
      } catch (error) {
        console.error('Error fetching appearance settings:', error);
      }
    };
    fetchAppearance();
  }, []);

  // Fetch popular services for suggestions
  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current.services) return;
    fetchedRef.current.services = true;
    
    const fetchPopularServices = async () => {
      try {
        const response = await publicAPI.getPopularServices();
        setPopularServices(response.services || []);
      } catch (error) {
        console.error('Error fetching popular services:', error);
      }
    };
    fetchPopularServices();
  }, []);

  // Fetch top rated salons for featured section
  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current.topRated) return;
    fetchedRef.current.topRated = true;
    
    const fetchTopRatedSalons = async () => {
      try {
        setTopRatedLoading(true);
        const response = await publicAPI.search({ min_rating: 4 });
        const salonsData = response.salons || response.data || [];
        // Sort by rating and take top 6
        const sorted = salonsData
          .sort((a: Salon, b: Salon) => (b.average_rating || b.rating || 0) - (a.average_rating || a.rating || 0))
          .slice(0, 6);
        setTopRatedSalons(sorted);
      } catch (error) {
        console.error('Error fetching top rated salons:', error);
      } finally {
        setTopRatedLoading(false);
      }
    };
    fetchTopRatedSalons();
  }, []);

  // Fetch newest salons
  useEffect(() => {
    if (fetchedRef.current.newest) return;
    fetchedRef.current.newest = true;
    
    const fetchNewestSalons = async () => {
      try {
        setNewestLoading(true);
        const response = await publicAPI.search({ sort: 'newest', per_page: 6 });
        const salonsData = response.salons || response.data || [];
        setNewestSalons(salonsData.slice(0, 6));
      } catch (error) {
        console.error('Error fetching newest salons:', error);
      } finally {
        setNewestLoading(false);
      }
    };
    fetchNewestSalons();
  }, []);

  // Fetch men's barbers/salons
  useEffect(() => {
    if (fetchedRef.current.menSalons) return;
    fetchedRef.current.menSalons = true;
    
    const fetchMenSalons = async () => {
      try {
        setMenSalonsLoading(true);
        const response = await publicAPI.search({ audience: 'men', per_page: 6 } as any);
        const salonsData = response.salons || response.data || [];
        setMenSalons(salonsData.slice(0, 6));
      } catch (error) {
        console.error('Error fetching men salons:', error);
      } finally {
        setMenSalonsLoading(false);
      }
    };
    fetchMenSalons();
  }, []);

  // Fetch featured/promoted salon (admin controlled)
  useEffect(() => {
    if (fetchedRef.current.featured) return;
    fetchedRef.current.featured = true;
    
    const fetchFeaturedSalon = async () => {
      try {
        setFeaturedSalonLoading(true);
        const response = await publicSettingsAPI.getFeaturedSalon();
        if (response.salon) {
          setFeaturedSalon(response.salon);
        }
        if (response.text) {
          setFeaturedSalonText(response.text);
        }
        if (response.visibility) {
          setFeaturedSalonVisibility(response.visibility);
        }
        if (response.show_top_rated !== undefined) {
          setShowTopRated(response.show_top_rated);
        }
        if (response.show_newest !== undefined) {
          setShowNewest(response.show_newest);
        }
      } catch (error) {
        console.error('Error fetching featured salon:', error);
      } finally {
        setFeaturedSalonLoading(false);
      }
    };
    fetchFeaturedSalon();
  }, []);

  // Default service tags to show when no popular services from API
  const defaultServiceTags = [
    'Muško šišanje',
    'Žensko šišanje',
    'Farbanje kose',
    'Pramenovi',
    'Feniranje',
    'Manikir',
    'Pedikir'
  ];

  // Calculate max services to show based on screen height (mobile only)
  const getMaxServicesToShow = (): number => {
    // On larger screens, show all 8
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return 8;
    // On small height mobile devices (< 700px), show 3
    if (screenHeight < 700) return 3;
    // On medium height mobile devices (< 800px), show 4
    if (screenHeight < 800) return 4;
    // On taller mobile devices, show 6
    return 6;
  };

  // Get top popular services for tag display, or use defaults
  const allServices = popularServices.length > 0 
    ? popularServices 
    : defaultServiceTags.map(name => ({ name, category: '', salon_count: 0, min_price: 0, max_price: 0, search_name: name.toLowerCase() }));
  
  const topServices = allServices.slice(0, getMaxServicesToShow());

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Load user's favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user || user.role !== 'klijent') return;
      
      try {
        const favoritesData = await favoriteAPI.getFavorites();
        const favoriteIds = new Set<number>(favoritesData.map((s: any) => s.id));
        setFavorites(favoriteIds);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    
    loadFavorites();
  }, [user]);

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent, salonId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (user.role !== 'klijent') {
      return;
    }
    
    setFavoriteLoading(salonId);
    try {
      if (favorites.has(salonId)) {
        await favoriteAPI.removeFavorite(String(salonId));
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(salonId);
          return newSet;
        });
      } else {
        await favoriteAPI.addFavorite(String(salonId));
        setFavorites(prev => new Set(prev).add(salonId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(null);
    }
  };

  // Search cities with debounce
  useEffect(() => {
    const searchCities = async () => {
      if (citySearchQuery.length < 1) {
        // Fetch all cities when no query
        try {
          setCitySearchLoading(true);
          const response = await locationsAPI.getAll({});
          setCityLocations(response.locations || []);
        } catch (error) {
          console.error('Error fetching cities:', error);
        } finally {
          setCitySearchLoading(false);
        }
        return;
      }
      
      try {
        setCitySearchLoading(true);
        const response = await locationsAPI.getAll({ search: citySearchQuery });
        setCityLocations(response.locations || []);
      } catch (error) {
        console.error('Error searching cities:', error);
      } finally {
        setCitySearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCities, 300);
    return () => clearTimeout(debounceTimer);
  }, [citySearchQuery]);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get distance to salon
  const getDistance = (salon: Salon): number | null => {
    if (!userLocation) return null;
    
    // Use latitude/longitude first (direct fields), then fallback to location object
    // Direct fields are more accurate as they come from Google Maps selection
    // Using Number() to ensure we're working with numbers, not strings
    const lat = salon.latitude ? Number(salon.latitude) : salon.location?.lat;
    const lng = salon.longitude ? Number(salon.longitude) : salon.location?.lng;
    
    if (!lat || !lng) return null;
    
    return calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      lat, 
      lng
    );
  };

  // Sort salons
  const sortSalons = useCallback((salonsToSort: Salon[]): Salon[] => {
    return [...salonsToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rating':
          // Sort by rating
          const ratingA = a.average_rating || a.rating || 0;
          const ratingB = b.average_rating || b.rating || 0;
          comparison = ratingA - ratingB;
          break;
        case 'reviews':
          // Sort by number of reviews
          const reviewsA = a.reviews_count || a.review_count || 0;
          const reviewsB = b.reviews_count || b.review_count || 0;
          comparison = reviewsA - reviewsB;
          break;
        case 'name':
          // Sort alphabetically (Croatian locale)
          comparison = a.name.localeCompare(b.name, 'hr');
          break;
        case 'distance':
          // Sort by distance
          const distA = getDistance(a) ?? Infinity;
          const distB = getDistance(b) ?? Infinity;
          comparison = distA - distB;
          break;
        default:
          comparison = 0;
      }
      
      // Apply sort direction
      // asc: a - b (smaller/lower first)
      // desc: b - a (bigger/higher first)
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [sortBy, sortDirection, userLocation]);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current.cities) return;
    fetchedRef.current.cities = true;
    
    const fetchCities = async () => {
      try {
        const response = await publicAPI.getCities();
        setCities(response.cities || []);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const searchSalons = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filters.q) params.q = filters.q;
        if (filters.city) params.city = filters.city;
        if (filters.service) params.service = filters.service;
        if (filters.min_rating) params.min_rating = filters.min_rating;
        if (filters.audience) params.audience = filters.audience;
        if (filters.date) params.date = filters.date;
        if (filters.time) params.time = filters.time;
        
        const response = await publicAPI.search(params);
        setSalons(response.salons || response.data || []);
      } catch (error) {
        console.error('Error searching salons:', error);
        setSalons([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchSalons, 300);
    return () => clearTimeout(debounce);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
    });
    setSearchParams(newParams);
  };

  const clearFilter = (key: keyof SearchFilters) => {
    handleFilterChange(key, '');
  };

  const clearAllFilters = () => {
    const emptyFilters: SearchFilters = {
      q: '',
      city: '',
      service: '',
      min_rating: '',
      audience: '',
      date: '',
      time: '',
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  // Sorted salons
  const sortedSalons = sortSalons(salons);

  // Audience options - without unisex
  const audienceOptions = [
    { value: '', label: 'Svi' },
    { value: 'women', label: 'Žene' },
    { value: 'men', label: 'Muškarci' },
    { value: 'children', label: 'Djeca' },
  ];

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  // Target audience label helper
  const getAudienceLabel = (audience?: string): string => {
    switch (audience) {
      case 'women': return 'Žene';
      case 'men': return 'Muškarci';
      case 'children': return 'Djeca';
      default: return '';
    }
  };

  // Get audience color
  const getAudienceColor = (audience?: string): string => {
    switch (audience) {
      case 'women': return 'bg-pink-100 text-pink-800';
      case 'men': return 'bg-blue-100 text-blue-800';
      case 'children': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get today's working hours
  const getTodayWorkingHours = (salon: Salon): string | null => {
    if (!salon.working_hours) return null;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = salon.working_hours[today];
    
    if (!todayHours || !todayHours.is_open) return 'Zatvoreno';
    return `${todayHours.open}-${todayHours.close}`;
  };

  // Get audience tags from salon
  const getAudienceTags = (salon: Salon): string[] => {
    const tags: string[] = [];
    if (!salon.target_audience) return tags;
    
    if (typeof salon.target_audience === 'string') {
      if (salon.target_audience !== 'unisex') {
        tags.push(salon.target_audience);
      }
    } else {
      if (salon.target_audience.women) tags.push('women');
      if (salon.target_audience.men) tags.push('men');
      if (salon.target_audience.children) tags.push('children');
    }
    return tags;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation - transparent on mobile hero */}
      <MainNavbar transparent />
      
      {/* Search Header - Full screen on mobile - Dynamic gradient with optional background image */}
      <div 
        className="min-h-[100dvh] md:min-h-0 md:py-16 pt-20 md:pt-16 px-4 flex items-center justify-center md:block relative"
        style={{
          ...(heroBackgroundImage ? {
            backgroundImage: `url(${heroBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : gradientStyle)
        }}
      >
        {/* Gradient overlay when background image is present */}
        {heroBackgroundImage && (
          <div 
            className="absolute inset-0"
            style={{
              ...gradientStyle,
              opacity: 0.75
            }}
          />
        )}
        <div className="max-w-7xl mx-auto w-full md:mt-16 relative z-10">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-4">
            Pronađite i rezervišite salon online
          </h1>
          <p className="text-white/80 text-center mb-6 md:mb-8 text-base md:text-lg px-4">
            Pretražite frizerske i kozmetičke salone po gradu, blizini i slobodnim terminima.
Rezervacija je brza i besplatna.
          </p>
          
          {/* Main Search Input with Suggestions */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Pretraži salone, usluge ili grad (npr. šišanje, trajni lak, Sarajevo)"
                  value={filters.q}
                  onChange={(e) => {
                    handleFilterChange('q', e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setSearchFocused(true);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setSearchFocused(false);
                    // Delay hiding suggestions so clicks can register
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Scroll to results on mobile when Enter is pressed
                      if (window.innerWidth < 768) {
                        document.getElementById('salon-results')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }
                  }}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-pink-300 text-lg"
                />
              </div>
              <button
                onClick={() => {
                  // Scroll to results on mobile when search button is clicked
                  if (window.innerWidth < 768) {
                    document.getElementById('salon-results')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-6 py-4 bg-white text-pink-600 rounded-xl shadow-lg hover:bg-pink-50 transition-colors font-medium"
              >
                <MagnifyingGlassIcon className="h-6 w-6 md:hidden" />
                <span className="hidden md:inline">Pretraži</span>
              </button>
            </div>
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs text-gray-500 font-medium">Predložene usluge</span>
                </div>
                {filteredSuggestions.map((service, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-3 text-left hover:bg-pink-50 flex items-center justify-between transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleFilterChange('q', service.name);
                      setShowSuggestions(false);
                      // Scroll to results on mobile when suggestion is clicked
                      if (window.innerWidth < 768) {
                        setTimeout(() => {
                          document.getElementById('salon-results')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }
                    }}
                  >
                    <div>
                      <span className="font-medium text-gray-800">{service.name}</span>
                      <span className="text-sm text-gray-500 ml-2">u {service.salon_count} salona</span>
                    </div>
                    <span className="text-sm text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                      {service.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Service Tags */}
          {topServices.length > 0 && (
            <div className="max-w-3xl mx-auto mt-6">
              <p className="text-white/80 text-sm text-center mb-3">Popularne usluge:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {topServices.map((service, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleFilterChange('q', service.name);
                      // Scroll to results on mobile when tag is clicked
                      if (window.innerWidth < 768) {
                        setTimeout(() => {
                          document.getElementById('salon-results')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full backdrop-blur-sm transition-all hover:scale-105"
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Near Me Button */}
          <div className="max-w-2xl mx-auto mt-6">
            <button
              onClick={() => {
                if (nearMeActive) {
                  setNearMeActive(false);
                  setSortBy('rating');
                } else {
                  getUserLocation(true);
                }
              }}
              disabled={locationLoading}
              className={`w-full sm:w-auto mx-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                nearMeActive
                  ? 'bg-white text-pink-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              } ${locationLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {locationLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Tražim lokaciju...</span>
                </>
              ) : (
                <>
                  <MapPinIcon className="h-5 w-5" />
                  <span>{nearMeActive ? 'Blizu mene ✓' : 'Blizu mene'}</span>
                </>
              )}
            </button>
            {nearMeActive && userLocation && (
              <p className="text-white/80 text-xs text-center mt-2">
                Prikazujem salone sortirane po udaljenosti od vaše lokacije
              </p>
            )}
          </div>
          
          {/* Animated scroll arrow - visible on mobile only, positioned below "Blizu mene" button */}
          <div className="md:hidden max-w-2xl mx-auto mt-12 flex justify-center">
            <button 
              onClick={() => {
                document.getElementById('salon-results')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center animate-bounce"
            >
              <span className="text-white/70 text-sm mb-2">Pregledaj salone</span>
              <svg 
                className="w-6 h-6 text-white/80" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="salon-results" className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Filter Toggle & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-pink-50 border-pink-300 text-pink-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span>Filteri</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Očisti sve
              </button>
            )}
          </div>

          {/* View Mode & Sort Controls */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Lista"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 ${viewMode === 'map' ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Mapa"
              >
                <MapIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <ArrowsUpDownIcon className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {sortOptions.find(opt => opt.value === sortBy)?.label || 'Sortiraj'}
                  {sortDirection === 'desc' ? ' ↓' : ' ↑'}
                </span>
                <span className="sm:hidden">Sortiraj</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (sortBy === option.value) {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(option.value);
                          // Set default direction based on sort type
                          // Rating and reviews: desc (higher first)
                          // Distance: asc (closer first)
                          // Name: asc (A-Z)
                          if (option.value === 'distance' || option.value === 'name') {
                            setSortDirection('asc');
                          } else {
                            setSortDirection('desc');
                          }
                        }
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 ${
                        sortBy === option.value ? 'bg-pink-50 text-pink-700' : 'text-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </span>
                      {sortBy === option.value && (
                        <span className="text-xs text-pink-600">
                          {sortDirection === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-pink-500" />
              Filteri pretrage
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* City Filter - Autocomplete */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPinIcon className="h-4 w-4 text-pink-500" />
                  Grad
                </label>
                <div className="relative" ref={cityInputRef}>
                  <input
                    type="text"
                    value={filters.city || citySearchQuery}
                    onChange={(e) => {
                      setCitySearchQuery(e.target.value);
                      if (filters.city) {
                        handleFilterChange('city', '');
                      }
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    placeholder="Pretraži grad..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all pr-10"
                  />
                  {filters.city && (
                    <button
                      onClick={() => {
                        handleFilterChange('city', '');
                        setCitySearchQuery('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* City dropdown */}
                  {showCityDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                      {citySearchLoading ? (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          <div className="animate-spin h-5 w-5 border-2 border-pink-500 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                      ) : cityLocations.length > 0 ? (
                        <>
                          <button
                            onClick={() => {
                              handleFilterChange('city', '');
                              setCitySearchQuery('');
                              setShowCityDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-pink-50 text-gray-600 border-b border-gray-100"
                          >
                            Svi gradovi
                          </button>
                          {cityLocations.map((location) => (
                            <button
                              key={location.id}
                              onClick={() => {
                                handleFilterChange('city', location.name);
                                setCitySearchQuery('');
                                setShowCityDropdown(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left hover:bg-pink-50 transition-colors ${
                                filters.city === location.name ? 'bg-pink-100 text-pink-700' : 'text-gray-700'
                              }`}
                            >
                              {location.name}
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          Nema rezultata
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  Minimalna ocjena
                </label>
                <select
                  value={filters.min_rating}
                  onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                >
                  <option value="">Sve ocjene</option>
                  <option value="4.5">⭐ 4.5+</option>
                  <option value="4">⭐ 4+</option>
                  <option value="3.5">⭐ 3.5+</option>
                  <option value="3">⭐ 3+</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                  Datum termina
                </label>
                <input
                  type="date"
                  value={filters.date}
                  min={today}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                />
              </div>

              {/* Time Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ClockIcon className="h-4 w-4 text-green-500" />
                  Vrijeme termina
                </label>
                <select
                  value={filters.time}
                  onChange={(e) => handleFilterChange('time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                >
                  <option value="">Bilo koje vrijeme</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}h</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audience Filter - Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <UserGroupIcon className="h-4 w-4 text-purple-500" />
                Ciljna publika
              </label>
              <div className="flex flex-wrap gap-3">
                {audienceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('audience', option.value)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                      filters.audience === option.value
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-200'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:shadow-md'
                    }`}
                  >
                    {option.value === 'women' && '👩 '}
                    {option.value === 'men' && '👨 '}
                    {option.value === 'children' && '👶 '}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.q && (
              <FilterBadge label="Pretraga" value={filters.q} onClear={() => clearFilter('q')} />
            )}
            {filters.city && (
              <FilterBadge label="Grad" value={filters.city} onClear={() => clearFilter('city')} />
            )}
            {filters.min_rating && (
              <FilterBadge label="Ocjena" value={`${filters.min_rating}+`} onClear={() => clearFilter('min_rating')} />
            )}
            {filters.audience && (
              <FilterBadge 
                label="Publika" 
                value={getAudienceLabel(filters.audience)} 
                onClear={() => clearFilter('audience')} 
              />
            )}
            {filters.date && (
              <FilterBadge 
                label="Datum" 
                value={new Date(filters.date).toLocaleDateString('hr')} 
                onClear={() => clearFilter('date')} 
              />
            )}
            {filters.time && (
              <FilterBadge label="Vrijeme" value={filters.time} onClear={() => clearFilter('time')} />
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {loading ? 'Učitavanje...' : `Pronađeno ${salons.length} salona`}
          </p>
          {userLocation && (
            <p className="text-sm text-gray-500">
              <MapPinIcon className="h-4 w-4 inline mr-1" />
              Udaljenosti izračunate od vaše lokacije
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : viewMode === 'map' ? (
          /* Map View */
          <Suspense fallback={
            <div className="h-[600px] rounded-xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Učitavanje mape...</p>
              </div>
            </div>
          }>
            <SalonsMapView 
              salons={sortedSalons} 
              userLocation={userLocation}
            />
          </Suspense>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSalons.map((salon) => {
              const distance = getDistance(salon);
              const salonRating = salon.average_rating || salon.rating || 0;
              const salonReviewCount = salon.reviews_count || salon.review_count || 0;
              const primaryImage = salon.images?.find(img => img.is_primary)?.url || salon.images?.[0]?.url || salon.cover_image_url || salon.image_url;
              const todayHours = getTodayWorkingHours(salon);
              const audienceTags = getAudienceTags(salon);
              
              return (
                <div
                  key={salon.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col"
                >
                  {/* Image */}
                  <Link to={`/salon/${salon.slug}`} className="relative h-48 overflow-hidden block">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <span className="text-4xl font-bold text-pink-300">
                          {salon.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    {/* Rating Badge & Favorite Button - top right */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {salonRating > 0 && (
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1 shadow-lg">
                          <StarIconSolid className="h-5 w-5 text-yellow-400" />
                          <span className="font-bold text-gray-900">
                            {salonRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {/* Favorite Heart Button */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, salon.id)}
                        disabled={favoriteLoading === salon.id}
                        className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all disabled:opacity-50"
                        title={favorites.has(salon.id) ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
                      >
                        {favoriteLoading === salon.id ? (
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : favorites.has(salon.id) ? (
                          <HeartIconSolid className="h-5 w-5 text-red-500" />
                        ) : (
                          <HeartIcon className="h-5 w-5 text-gray-500 hover:text-red-500 transition-colors" />
                        )}
                      </button>
                    </div>

                    {/* Distance Badge - top left */}
                    {distance !== null && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 shadow-lg flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4 text-pink-500" />
                        {distance < 1 
                          ? `${Math.round(distance * 1000)} m` 
                          : `${distance.toFixed(1)} km`
                        }
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col">
                    <Link to={`/salon/${salon.slug}`}>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-pink-600 transition-colors mb-2">
                        {salon.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 text-pink-500" />
                      <span className="truncate">{salon.address}, {salon.city}</span>
                    </div>

                    {salon.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {salon.description}
                      </p>
                    )}

                    {/* Working Hours Today */}
                    {todayHours && (
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <ClockIcon className="h-4 w-4 mr-1 flex-shrink-0 text-pink-500" />
                        <span>{todayHours === 'Zatvoreno' ? 'Zatvoreno danas' : todayHours}</span>
                      </div>
                    )}

                    {/* Reviews count */}
                    <div className="text-gray-500 text-sm mb-4">
                      {salonReviewCount > 0 
                        ? `${salonReviewCount} recenzija`
                        : 'Novi salon'
                      }
                    </div>

                    {/* Audience Tags */}
                    {audienceTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {audienceTags.map((tag) => (
                          <span 
                            key={tag}
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getAudienceColor(tag)}`}
                          >
                            {getAudienceLabel(tag)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Buttons - Rezerviši & Map - styled like top rated salons */}
                    <div className="mt-auto pt-3 flex gap-2">
                      <Link
                        to={`/salon/${salon.slug}`}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium text-center transition-all shadow-md hover:shadow-lg"
                      >
                        Rezerviši termin
                      </Link>
                      {(salon.latitude || salon.location?.lat) && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${salon.latitude || salon.location?.lat},${salon.longitude || salon.location?.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center w-11 h-11 border border-gray-200 rounded-xl hover:bg-pink-50 hover:border-pink-200 transition-colors"
                          title="Prikaži na mapi"
                        >
                          <MapPinIcon className="h-5 w-5 text-gray-600" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && salons.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nema rezultata pretrage
            </h3>
            <p className="text-gray-500 mb-4">
              Pokušajte s drugim filterima ili pojmom pretrage.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Očisti sve filtere
              </button>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Featured Salon Section (Admin Controlled) - Displayed ABOVE Top Rated */}
      {(() => {
        // Determine if featured salon should be shown
        const shouldShowFeatured = !featuredSalonLoading && featuredSalon && (
          featuredSalonVisibility === 'all' || 
          (featuredSalonVisibility === 'location_only' && 
           filters.city && 
           featuredSalon.city?.toLowerCase() === filters.city.toLowerCase()
          )
        );
        
        if (!shouldShowFeatured) return null;
        
        // Get cover image - handle different response formats
        const featuredCoverImage = (featuredSalon as unknown as { cover_image?: string }).cover_image 
          || featuredSalon.cover_image_url 
          || featuredSalon.images?.[0]?.url
          || (featuredSalon.images?.[0] as unknown as { image_path?: string })?.image_path;
        
        return (
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
                ⭐ Istaknuti salon
              </span>
              <h2 className="text-3xl font-bold text-gray-900">
                {featuredSalonText}
              </h2>
            </div>

            <Link 
              to={`/salon/${featuredSalon.slug}`}
              className="block max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all group"
            >
              <div className="md:flex">
                {/* Image */}
                <div className="md:w-1/2 h-64 md:h-auto relative">
                  {featuredCoverImage ? (
                    <img
                      src={featuredCoverImage}
                      alt={featuredSalon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
                      <span className="text-6xl font-bold text-white/60">{featuredSalon.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                    {featuredSalon.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>{featuredSalon.address || featuredSalon.city}</span>
                  </div>

                  {(featuredSalon as unknown as { average_rating?: number }).average_rating !== undefined && (featuredSalon as unknown as { average_rating?: number }).average_rating! > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                        <StarIconSolid className="h-5 w-5 text-yellow-500" />
                        <span className="font-bold text-gray-900">{((featuredSalon as unknown as { average_rating?: number }).average_rating || 0).toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        ({(featuredSalon as unknown as { review_count?: number }).review_count || 0} recenzija)
                      </span>
                    </div>
                  )}

                  {featuredSalon.description && (
                    <p className="text-gray-600 mb-6 line-clamp-3">
                      {featuredSalon.description}
                    </p>
                  )}

                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-medium group-hover:from-orange-600 group-hover:to-red-600 transition-all self-start">
                    Pogledaj salon
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
        );
      })()}

      {/* Top Rated Salons Section */}
      {showTopRated && (
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ⭐ Najbolje ocijenjeni saloni
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Otkrijte salone s najvišim ocjenama korisnika. Kvaliteta i profesionalnost garantirani.
            </p>
          </div>

          {topRatedLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          ) : topRatedSalons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topRatedSalons.map((salon) => {
                const salonRating = salon.average_rating || salon.rating || 0;
                const salonReviewCount = salon.reviews_count || salon.review_count || 0;
                const primaryImage = salon.images?.find(img => img.is_primary)?.url || salon.images?.[0]?.url || salon.cover_image_url || salon.image_url;
                
                return (
                  <div
                    key={salon.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all group"
                  >
                    {/* Image */}
                    <Link to={`/salon/${salon.slug}`} className="relative h-48 overflow-hidden block">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={salon.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                          <span className="text-4xl font-bold text-pink-300">
                            {salon.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      {/* Rating Badge */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1 shadow-lg">
                        <StarIconSolid className="h-5 w-5 text-yellow-400" />
                        <span className="font-bold text-gray-900">{salonRating.toFixed(1)}</span>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-5">
                      <Link to={`/salon/${salon.slug}`}>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-pink-600 transition-colors mb-2">
                          {salon.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{salon.city}</span>
                      </div>

                      <div className="text-gray-500 text-sm mb-4">
                        {salonReviewCount > 0 
                          ? `${salonReviewCount} recenzija`
                          : 'Novi salon'
                        }
                      </div>

                      <Link
                        to={`/salon/${salon.slug}`}
                        className="block w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium text-center transition-all shadow-md hover:shadow-lg"
                      >
                        Pogledaj salon
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Trenutno nema ocijenjenih salona
            </div>
          )}
        </div>
      </div>
      )}

      {/* Newest Salons Section */}
      {showNewest && !newestLoading && newestSalons.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🆕 Najnoviji saloni
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Novo otvoreni saloni koji jedva čekaju da vas ugoste
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newestSalons.map((salon) => {
                const primaryImage = salon.images?.find(img => img.is_primary)?.url || salon.images?.[0]?.url || salon.cover_image_url || salon.image_url;
                
                return (
                  <Link
                    key={salon.id}
                    to={`/salon/${salon.slug}`}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        {primaryImage ? (
                          <img src={primaryImage} alt={salon.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">{salon.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {salon.name}
                        </h3>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          <span className="truncate">{salon.city}</span>
                        </div>
                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Novo
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Men's Barbers Section */}
      {!menSalonsLoading && menSalons.length > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                💈 Muški frizeri
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Barber shopovi i frizeri specijalizirani za muškarce
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menSalons.map((salon) => {
                const salonRating = salon.average_rating || salon.rating || 0;
                const primaryImage = salon.images?.find(img => img.is_primary)?.url || salon.images?.[0]?.url || salon.cover_image_url || salon.image_url;
                
                return (
                  <Link
                    key={salon.id}
                    to={`/salon/${salon.slug}`}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all group"
                  >
                    <div className="relative h-40">
                      {primaryImage ? (
                        <img src={primaryImage} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-gray-300 flex items-center justify-center">
                          <span className="text-4xl">💈</span>
                        </div>
                      )}
                      {salonRating > 0 && (
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow">
                          <StarIconSolid className="h-4 w-4 text-yellow-400" />
                          <span className="font-bold text-sm text-gray-900">{salonRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-slate-600 transition-colors">
                        {salon.name}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{salon.city}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Why Choose Us Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Zašto odabrati Frizerino?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Jednostavno i brzo pronađite savršen salon za vas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MagnifyingGlassIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lako pronađite</h3>
              <p className="text-gray-600">
                Pretražite salone po lokaciji, usluzi ili ocjeni. Filter po vašim potrebama.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CalendarDaysIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Online rezervacija</h3>
              <p className="text-gray-600">
                Rezervišite termin u par klikova, 24/7. Bez čekanja na telefon.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <StarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Prave recenzije</h3>
              <p className="text-gray-600">
                Provjerene recenzije od stvarnih korisnika. Znate šta očekivati.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Close sort dropdown when clicking outside */}
      {showSortDropdown && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowSortDropdown(false)}
        />
      )}
      
      {/* Footer */}
      <PublicFooter />
      
      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnTo="/pretraga"
      />
    </div>
  );
};
