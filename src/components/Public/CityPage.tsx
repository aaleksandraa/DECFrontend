import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI } from '../../services/api';
import { Salon } from '../../types';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { 
  MapPinIcon, 
  StarIcon,
  ScissorsIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ListBulletIcon,
  MapIcon,
  ArrowsUpDownIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

// Lazy load map component
const SalonsMapView = lazy(() => import('./SalonsMapView'));

interface CityData {
  name: string;
  slug: string;
}

interface MetaData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
}

// Sort options
const sortOptions = [
  { value: 'rating', label: 'Ocjena', icon: StarIcon },
  { value: 'reviews', label: 'Broj recenzija', icon: UserGroupIcon },
  { value: 'name', label: 'Naziv', icon: ListBulletIcon },
  { value: 'distance', label: 'Udaljenost', icon: MapPinIcon },
];

// Service categories with SEO data
const serviceCategories: Record<string, { name: string; icon: string; keywords: string[]; description: string }> = {
  'frizeri': { 
    name: 'Frizeri', 
    icon: '✂️', 
    keywords: ['frizer', 'frizerski salon', 'šišanje', 'farbanje kose', 'pramenovi', 'feniranje'],
    description: 'Pronađite najbolje frizere za šišanje, farbanje, pramenove i styling kose.'
  },
  'kozmeticari': { 
    name: 'Kozmetičari', 
    icon: '💆', 
    keywords: ['kozmetičar', 'kozmetički salon', 'tretman lica', 'čišćenje lica', 'anti-age'],
    description: 'Pronađite profesionalne kozmetičare za tretmane lica i tijela.'
  },
  'manikir': { 
    name: 'Manikir', 
    icon: '💅', 
    keywords: ['manikir', 'gel lak', 'nadogradnja noktiju', 'nail art', 'nokti'],
    description: 'Pronađite najbolje salone za manikir, gel lak i nadogradnju noktiju.'
  },
  'pedikir': { 
    name: 'Pedikir', 
    icon: '🦶', 
    keywords: ['pedikir', 'medicinski pedikir', 'njega stopala'],
    description: 'Pronađite salone za profesionalni pedikir i njegu stopala.'
  },
  'berber': { 
    name: 'Berber', 
    icon: '🧔', 
    keywords: ['berber', 'muško šišanje', 'brada', 'brijanje', 'fade'],
    description: 'Pronađite najbolje berbere za muško šišanje, brijanje i uređivanje brade.'
  },
  'depilacija': { 
    name: 'Depilacija', 
    icon: '✨', 
    keywords: ['depilacija', 'vosak', 'laser depilacija', 'šećerna pasta'],
    description: 'Pronađite salone za profesionalnu depilaciju voskom ili laserom.'
  },
  'masaza': { 
    name: 'Masaža', 
    icon: '💆‍♂️', 
    keywords: ['masaža', 'relax masaža', 'sportska masaža', 'anticelulitna masaža'],
    description: 'Pronađite salone za relax, sportsku i terapeutsku masažu.'
  },
  'trepavice': { 
    name: 'Trepavice', 
    icon: '👁️', 
    keywords: ['trepavice', 'nadogradnja trepavica', 'lash lift', 'laminacija trepavica'],
    description: 'Pronađite stručnjake za nadogradnju i laminaciju trepavica.'
  },
  'obrve': { 
    name: 'Obrve', 
    icon: '🖌️', 
    keywords: ['obrve', 'microblading', 'laminacija obrva', 'oblikovanje obrva'],
    description: 'Pronađite stručnjake za oblikovanje, microblading i laminaciju obrva.'
  },
};

// City SEO data with rich keywords
const cityKeywords: Record<string, string[]> = {
  'sarajevo': ['frizer sarajevo', 'frizeri u sarajevu', 'frizerski salon sarajevo', 'šišanje sarajevo', 'farbanje kose sarajevo', 'kozmetičar sarajevo', 'kozmetički salon sarajevo', 'manikir sarajevo', 'pedikir sarajevo', 'salon ljepote sarajevo', 'berber sarajevo', 'muško šišanje sarajevo', 'ženski frizer sarajevo'],
  'banja-luka': ['frizer banja luka', 'frizeri u banja luci', 'frizerski salon banja luka', 'šišanje banja luka', 'farbanje kose banja luka', 'kozmetičar banja luka', 'kozmetički salon banja luka', 'manikir banja luka', 'pedikir banja luka', 'salon ljepote banja luka'],
  'tuzla': ['frizer tuzla', 'frizeri u tuzli', 'frizerski salon tuzla', 'šišanje tuzla', 'farbanje kose tuzla', 'kozmetičar tuzla', 'kozmetički salon tuzla', 'manikir tuzla', 'pedikir tuzla', 'salon ljepote tuzla'],
  'mostar': ['frizer mostar', 'frizeri u mostaru', 'frizerski salon mostar', 'šišanje mostar', 'farbanje kose mostar', 'kozmetičar mostar', 'kozmetički salon mostar', 'manikir mostar', 'pedikir mostar', 'salon ljepote mostar'],
  'zenica': ['frizer zenica', 'frizeri u zenici', 'frizerski salon zenica', 'šišanje zenica', 'farbanje kose zenica', 'kozmetičar zenica', 'manikir zenica', 'pedikir zenica', 'salon ljepote zenica'],
  'bijeljina': ['frizer bijeljina', 'frizeri u bijeljini', 'frizerski salon bijeljina', 'šišanje bijeljina', 'kozmetičar bijeljina', 'manikir bijeljina', 'salon ljepote bijeljina'],
  'prijedor': ['frizer prijedor', 'frizeri u prijedoru', 'frizerski salon prijedor', 'šišanje prijedor', 'kozmetičar prijedor', 'salon ljepote prijedor'],
  'brcko': ['frizer brčko', 'frizeri u brčkom', 'frizerski salon brčko', 'šišanje brčko', 'kozmetičar brčko', 'salon ljepote brčko'],
  'trebinje': ['frizer trebinje', 'frizeri u trebinju', 'frizerski salon trebinje', 'šišanje trebinje', 'kozmetičar trebinje', 'salon ljepote trebinje'],
  'doboj': ['frizer doboj', 'frizeri u doboju', 'frizerski salon doboj', 'šišanje doboj', 'kozmetičar doboj', 'salon ljepote doboj'],
};

export const CityPage: React.FC = () => {
  const { citySlug, categorySlug } = useParams<{ citySlug: string; categorySlug?: string }>();
  
  const [city, setCity] = useState<CityData | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if citySlug is actually a category (for routes like /saloni/kozmeticari)
  const isCategoryOnly = useMemo(() => 
    citySlug ? (serviceCategories[citySlug] !== undefined && !categorySlug) : false,
    [citySlug, categorySlug]
  );
  
  // Get current category info
  const currentCategory = useMemo(() => {
    if (isCategoryOnly && citySlug) {
      return serviceCategories[citySlug];
    }
    if (categorySlug) {
      return serviceCategories[categorySlug];
    }
    return null;
  }, [isCategoryOnly, citySlug, categorySlug]);
  
  // View mode: list or map
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  // User location for distance calculation
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // User denied location or error - that's fine
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!citySlug) return;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if citySlug is actually a category
        const isCategoryRoute = serviceCategories[citySlug] !== undefined && !categorySlug;
        
        // If category-only (no city), search all salons with that service
        if (isCategoryRoute) {
          const category = serviceCategories[citySlug];
          
          const searchData = await publicAPI.searchSalons({
            service: category.name,
            per_page: 50
          });
          
          setCity(null);
          setSalons(searchData.salons?.data || searchData.salons || []);
          
          setMeta({
            title: `${category.name} - ${category.description} | Frizerino`,
            description: `${category.description} Pronađite najbolje ${category.name.toLowerCase()} salone u Bosni i Hercegovini. Online zakazivanje termina.`,
            keywords: category.keywords,
            canonical: `/saloni/${citySlug}`
          });
          setSchema(null);
        }
        // If category is specified with city
        else if (categorySlug && serviceCategories[categorySlug]) {
          const category = serviceCategories[categorySlug];
          
          const searchData = await publicAPI.searchSalons({
            city: citySlug,
            service: category.name,
            per_page: 50
          });
          
          const cityName = slugToName(citySlug);
          setCity({ name: cityName, slug: citySlug });
          setSalons(searchData.salons?.data || searchData.salons || []);
          
          setMeta({
            title: `${category.name} u ${cityName} - ${category.description} | Frizerino`,
            description: `${category.description} Pronađite najbolje ${category.name.toLowerCase()} salone u gradu ${cityName}. Online zakazivanje termina.`,
            keywords: category.keywords.map(k => `${k} ${cityName.toLowerCase()}`),
            canonical: `/saloni/${citySlug}/${categorySlug}`
          });
          setSchema(null);
        } 
        // Load all salons for the city
        else {
          const data = await publicAPI.getSalonsByCity(citySlug);
          setCity(data.city);
          setSalons(data.salons?.data || data.salons || []);
          setMeta(data.meta);
          setSchema(data.schema);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Grad nije pronađen');
        } else {
          setError('Greška pri učitavanju podataka');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [citySlug, categorySlug]);

  // Convert slug to readable name
  const slugToName = (slug: string): string => {
    const cityNames: Record<string, string> = {
      'sarajevo': 'Sarajevo',
      'banja-luka': 'Banja Luka',
      'tuzla': 'Tuzla',
      'mostar': 'Mostar',
      'zenica': 'Zenica',
      'bijeljina': 'Bijeljina',
      'prijedor': 'Prijedor',
      'brcko': 'Brčko',
      'trebinje': 'Trebinje',
      'doboj': 'Doboj',
    };
    return cityNames[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  };

  // Calculate distance between user and salon
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get distance for a salon
  const getDistance = (salon: Salon): number | null => {
    if (!userLocation) return null;
    const lat = salon.latitude || salon.location?.lat;
    const lng = salon.longitude || salon.location?.lng;
    if (!lat || !lng) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
  };

  // Sort salons
  const sortedSalons = useMemo(() => {
    const sorted = [...salons];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rating':
          const ratingA = a.average_rating || a.rating || 0;
          const ratingB = b.average_rating || b.rating || 0;
          comparison = ratingA - ratingB;
          break;
        case 'reviews':
          const reviewsA = a.reviews_count || a.review_count || 0;
          const reviewsB = b.reviews_count || b.review_count || 0;
          comparison = reviewsA - reviewsB;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'distance':
          const distA = getDistance(a) ?? Infinity;
          const distB = getDistance(b) ?? Infinity;
          comparison = distA - distB;
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [salons, sortBy, sortDirection, userLocation]);

  // Get today's working hours
  const getTodayWorkingHours = (salon: Salon): string | null => {
    if (!salon.working_hours) return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = salon.working_hours[today];
    if (!hours || !hours.is_open) return 'Zatvoreno';
    return `${hours.open} - ${hours.close}`;
  };

  // Generate enhanced SEO keywords
  const getEnhancedKeywords = (): string => {
    const slug = citySlug || '';
    const customKeywords = cityKeywords[slug] || [];
    const defaultKeywords = meta?.keywords || [];
    const cityName = city?.name || '';
    
    // Generate generic keywords based on city name
    const genericKeywords = cityName ? [
      `frizer ${cityName.toLowerCase()}`,
      `frizeri u ${cityName.toLowerCase()}`,
      `frizerski salon ${cityName.toLowerCase()}`,
      `šišanje ${cityName.toLowerCase()}`,
      `farbanje kose ${cityName.toLowerCase()}`,
      `kozmetičar ${cityName.toLowerCase()}`,
      `kozmetički salon ${cityName.toLowerCase()}`,
      `manikir ${cityName.toLowerCase()}`,
      `pedikir ${cityName.toLowerCase()}`,
      `salon ljepote ${cityName.toLowerCase()}`,
      `zakazivanje termina ${cityName.toLowerCase()}`,
      `online rezervacija ${cityName.toLowerCase()}`
    ] : [];
    
    return [...new Set([...customKeywords, ...defaultKeywords, ...genericKeywords])].join(', ');
  };

  // Generate enhanced meta description
  const getEnhancedDescription = (): string => {
    const cityName = city?.name || '';
    const salonCount = salons.length;
    return meta?.description || 
      `Pronađite najbolje frizere i kozmetičke salone u ${cityName}. ${salonCount}+ verificiranih salona. ` +
      `Šišanje, farbanje, manikir, pedikir, tretmani lica. Zakažite termin online besplatno!`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= Math.round(rating) ? (
            <StarSolid key={star} className="w-4 h-4 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="w-4 h-4 text-gray-300" />
          )
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">{error}</h1>
          <Link to="/pretraga" className="text-orange-600 hover:underline">
            ← Povratak na pretragu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{meta?.title || `Frizeri i Saloni u ${city?.name} - Šišanje, Farbanje, Manikir | Frizerino`}</title>
        <meta name="description" content={getEnhancedDescription()} />
        <meta name="keywords" content={getEnhancedKeywords()} />
        <link rel="canonical" href={meta?.canonical || `https://frizerino.com/saloni/${citySlug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={meta?.title || `Frizeri i Saloni u ${city?.name} | Frizerino`} />
        <meta property="og:description" content={getEnhancedDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={meta?.canonical || `https://frizerino.com/saloni/${citySlug}`} />
        <meta property="og:site_name" content="Frizerino" />
        <meta property="og:locale" content="bs_BA" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta?.title || `Frizeri i Saloni u ${city?.name} | Frizerino`} />
        <meta name="twitter:description" content={getEnhancedDescription()} />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="geo.region" content="BA" />
        <meta name="geo.placename" content={city?.name} />

        {/* JSON-LD Schema */}
        {schema && (
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        )}
        
        {/* Additional Schema for Local Business Listing */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `Frizeri i Saloni u ${city?.name}`,
            "description": getEnhancedDescription(),
            "url": `https://frizerino.com/saloni/${citySlug}`,
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": sortedSalons.slice(0, 10).map((salon, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "HairSalon",
                  "name": salon.name,
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": salon.address,
                    "addressLocality": city?.name,
                    "addressCountry": "BA"
                  },
                  "aggregateRating": salon.rating ? {
                    "@type": "AggregateRating",
                    "ratingValue": salon.rating,
                    "reviewCount": salon.review_count || 0
                  } : undefined,
                  "url": `https://frizerino.com/salon/${salon.slug || salon.id}`
                }
              }))
            }
          })}
        </script>
      </Helmet>

      <MainNavbar />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <Link 
              to={currentCategory && city ? `/saloni/${citySlug}` : "/pretraga"}
              className="inline-flex items-center text-orange-100 hover:text-white mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              {currentCategory && city && `Svi saloni u ${city.name}`}
              {currentCategory && !city && 'Povratak na pretragu'}
              {!currentCategory && 'Povratak na pretragu'}
            </Link>
            
            <div className="flex items-center gap-3 mb-4">
              {currentCategory ? (
                <span className="text-4xl">{currentCategory.icon}</span>
              ) : (
                <MapPinIcon className="w-10 h-10 text-white" />
              )}
              <h1 className="text-3xl sm:text-4xl font-bold">
                {currentCategory && !city && currentCategory.name}
                {currentCategory && city && `${currentCategory.name} u ${city.name}`}
                {!currentCategory && city && `Frizeri i Saloni u ${city.name}`}
              </h1>
            </div>
            
            <p className="text-xl text-orange-100">
              {currentCategory && !city && `${salons.length} ${salons.length === 1 ? 'salon' : 'salona'} sa uslugom ${currentCategory.name.toLowerCase()}`}
              {currentCategory && city && `${salons.length} ${salons.length === 1 ? 'salon' : 'salona'} sa uslugom ${currentCategory.name.toLowerCase()} u ${city.name}`}
              {!currentCategory && city && `${salons.length} ${salons.length === 1 ? 'salon' : salons.length < 5 ? 'salona' : 'salona'} u gradu ${city.name}`}
            </p>
            
            {currentCategory && (
              <p className="mt-2 text-orange-200">
                {currentCategory.description}
              </p>
            )}
          </div>
        </div>

        {/* Category Filter Tabs (when on city page without category) */}
        {!currentCategory && (
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
                <Link
                  to={`/saloni/${citySlug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-orange-500 text-white whitespace-nowrap"
                >
                  Svi saloni
                </Link>
                {Object.entries(serviceCategories).slice(0, 6).map(([slug, cat]) => (
                  <Link
                    key={slug}
                    to={`/saloni/${citySlug}/${slug}`}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600 transition-colors whitespace-nowrap"
                  >
                    {cat.icon} {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Category Filter Tabs (when on category page) */}
        {currentCategory && (
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
                <Link
                  to={`/saloni/${citySlug}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600 transition-colors whitespace-nowrap"
                >
                  Svi saloni
                </Link>
                {Object.entries(serviceCategories).map(([slug, cat]) => (
                  <Link
                    key={slug}
                    to={`/saloni/${citySlug}/${slug}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      categorySlug === slug 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2" itemScope itemType="https://schema.org/BreadcrumbList">
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link to="/" className="hover:text-orange-600" itemProp="item">
                  <span itemProp="name">Početna</span>
                </Link>
                <meta itemProp="position" content="1" />
              </li>
              <span className="mx-2">›</span>
              <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <Link to="/pretraga" className="hover:text-orange-600" itemProp="item">
                  <span itemProp="name">Pretraga</span>
                </Link>
                <meta itemProp="position" content="2" />
              </li>
              {city && (
                <>
                  <span className="mx-2">›</span>
                  <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <span className="text-gray-900" itemProp="name">{city.name}</span>
                    <meta itemProp="position" content="3" />
                  </li>
                </>
              )}
              {currentCategory && (
                <>
                  <span className="mx-2">›</span>
                  <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                    <span className="text-gray-900" itemProp="name">{currentCategory.name}</span>
                    <meta itemProp="position" content={city ? "4" : "3"} />
                  </li>
                </>
              )}
            </ol>
          </nav>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
          {/* SEO Text */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {currentCategory && !city && `Pronađite najbolje ${currentCategory.name.toLowerCase()} salone`}
              {currentCategory && city && `Pronađite najbolje ${currentCategory.name.toLowerCase()} salone u ${city.name}`}
              {!currentCategory && city && `Pronađite najbolji frizerski ili kozmetički salon u ${city.name}`}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {currentCategory && !city && (
                <>
                  Frizerino vam nudi najširi izbor {currentCategory.name.toLowerCase()} salona u Bosni i Hercegovini. 
                  Pogledajte cijene usluga, pročitajte recenzije drugih klijenata i zakažite svoj termin online. 
                  {currentCategory.description}
                </>
              )}
              {currentCategory && city && (
                <>
                  Frizerino vam nudi najširi izbor {currentCategory.name.toLowerCase()} salona u gradu {city.name}. 
                  Pogledajte cijene usluga, pročitajte recenzije drugih klijenata i zakažite svoj termin online. 
                  {currentCategory.description}
                </>
              )}
              {!currentCategory && city && (
                <>
                  Frizerino vam nudi najširi izbor frizerskih i kozmetičkih salona u gradu {city.name}. 
                  Pogledajte cijene usluga, pročitajte recenzije drugih klijenata i zakažite svoj termin online. 
                  Bilo da tražite klasično šišanje, moderno farbanje, pramenove, tretmane lica ili njegu noktiju, 
                  ovdje ćete pronaći salon koji odgovara vašim potrebama i budžetu.
                </>
              )}
            </p>
          </div>

          {/* Controls: View Toggle & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'list' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'map' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MapIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Mapa</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 transition-colors"
              >
                <ArrowsUpDownIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  Sortiraj: {sortOptions.find(o => o.value === sortBy)?.label}
                </span>
              </button>
              
              {showSortDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          if (sortBy === option.value) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy(option.value);
                            setSortDirection('desc');
                          }
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-orange-50 ${
                          sortBy === option.value ? 'text-orange-600 bg-orange-50' : 'text-gray-700'
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                        {sortBy === option.value && (
                          <span className="ml-auto text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : viewMode === 'map' ? (
            /* Map View */
            <Suspense fallback={
              <div className="h-[600px] rounded-xl overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
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
            <>
              {/* Salons Grid */}
              {sortedSalons.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ScissorsIcon className="w-12 h-12 text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Trenutno nema salona u {city?.name}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Još uvijek nema registrovanih frizersko-kozmetičkih salona u ovom gradu. 
                    Pokušajte pretražiti u nekom drugom gradu ili se vratite na početnu stranicu.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/pretraga"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                      Pretraži sve salone
                    </Link>
                    <Link
                      to="/register?type=salon"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      Registruj svoj salon
                    </Link>
                  </div>
                  
                  {/* Nearby Cities Suggestion */}
                  <div className="mt-10 pt-8 border-t border-gray-100">
                    <p className="text-sm text-gray-400 mb-4">Pogledajte salone u drugim gradovima:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Sarajevo', 'Banja Luka', 'Tuzla', 'Mostar', 'Zenica', 'Doboj'].map((cityName) => {
                        const slug = cityName.toLowerCase().replace(/\s+/g, '-');
                        if (slug === citySlug) return null;
                        return (
                          <Link
                            key={slug}
                            to={`/saloni/${slug}`}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-orange-100 hover:text-orange-600 transition-colors"
                          >
                            {cityName}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedSalons.map((salon) => {
                    const distance = getDistance(salon);
                    const salonRating = salon.average_rating || salon.rating || 0;
                    const salonReviewCount = salon.reviews_count || salon.review_count || 0;
                    const primaryImage = salon.images?.find(img => img.is_primary)?.url || salon.images?.[0]?.url;
                    const todayHours = getTodayWorkingHours(salon);
                    
                    return (
                      <Link
                        key={salon.id}
                        to={`/salon/${salon.slug || salon.id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                      >
                        {/* Salon Image */}
                        <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={`${salon.name} - frizersko-kozmetički salon u ${city?.name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ScissorsIcon className="w-16 h-16 text-orange-300" />
                            </div>
                          )}
                          {salon.is_verified && (
                            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <SparklesIcon className="w-3 h-3" />
                              Verificiran
                            </div>
                          )}
                          {distance !== null && (
                            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3" />
                              {distance.toFixed(1)} km
                            </div>
                          )}
                        </div>

                        {/* Salon Info */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {salon.name}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-gray-500 mt-1">
                            <MapPinIcon className="w-4 h-4" />
                            <span className="text-sm">{salon.address}</span>
                          </div>

                          {todayHours && (
                            <div className="flex items-center gap-2 text-gray-500 mt-1">
                              <ClockIcon className="w-4 h-4" />
                              <span className="text-sm">Danas: {todayHours}</span>
                            </div>
                          )}

                          {salonRating > 0 && (
                            <div className="mt-2">
                              {renderStars(salonRating)}
                              <span className="text-xs text-gray-400 ml-2">
                                {salonReviewCount} recenzija
                              </span>
                            </div>
                          )}

                          {salon.services && salon.services.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {salon.services.slice(0, 3).map((service) => (
                                <span
                                  key={service.id}
                                  className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded"
                                >
                                  {service.name}
                                </span>
                              ))}
                              {salon.services.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{salon.services.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <span className="text-orange-600 font-medium text-sm group-hover:underline">
                              Pogledaj detalje i zakaži termin →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}


          
          {/* Related Categories - Show on category page */}
          {currentCategory && (
            <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Druge kategorije u {city?.name}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Object.entries(serviceCategories)
                  .filter(([slug]) => slug !== categorySlug)
                  .slice(0, 4)
                  .map(([slug, category]) => (
                    <Link
                      key={slug}
                      to={`/saloni/${citySlug}/${slug}`}
                      className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-center group"
                    >
                      <span className="text-3xl">{category.icon}</span>
                      <h3 className="font-semibold text-gray-900 mt-2 group-hover:text-orange-600">
                        {category.name}
                      </h3>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
    </>
  );
};

export default CityPage;
