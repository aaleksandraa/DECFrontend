import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { jobAdsAPI, locationsAPI } from '../../services/api';
import { 
  BriefcaseIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  UserIcon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  XMarkIcon,
  ClockIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface JobAd {
  id: number;
  company_name: string;
  position_title: string;
  description: string;
  gender_requirement: 'male' | 'female' | 'any';
  contact_email: string;
  contact_phone?: string;
  city?: string;
  deadline?: string;
  is_active: boolean;
  created_at: string;
  salon?: {
    id: number;
    name: string;
    slug: string;
    city: string;
  };
}

export const JobAdsPage: React.FC = () => {
  const [jobAds, setJobAds] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedAd, setSelectedAd] = useState<JobAd | null>(null);
  
  // City autocomplete state
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    setCityFilter(city);
    setCitySearch(city);
    setShowCityDropdown(false);
    setCurrentPage(1);
  };

  const clearCityFilter = () => {
    setCityFilter('');
    setCitySearch('');
    setCurrentPage(1);
  };

  // Fetch cities for dropdown
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await locationsAPI.getAll();
        const cityNames = [...new Set((response.locations || []).map((loc: any) => loc.name))].sort() as string[];
        setCities(cityNames);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  const fetchJobAds = async () => {
    try {
      setLoading(true);
      const response = await jobAdsAPI.getAll({
        page: currentPage,
        per_page: 12,
        q: searchQuery || undefined,
        city: cityFilter || undefined,
        gender: genderFilter || undefined
      });
      setJobAds(response.job_ads || []);
      setTotalPages(response.meta?.last_page || 1);
      setTotalAds(response.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching job ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobAds();
  }, [currentPage, searchQuery, cityFilter, genderFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobAds();
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Muškarac';
      case 'female': return 'Žena';
      case 'any': return 'M/Ž';
      default: return 'M/Ž';
    }
  };

  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-700';
      case 'female': return 'bg-pink-100 text-pink-700';
      case 'any': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}.`;
  };

  const isDeadlineSoon = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isDeadlineExpired = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <BriefcaseIcon className="h-16 w-16 text-white/80 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Oglasi za posao
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Pronađite posao u frizerskim i kozmetičkim salonima. Prijavite se direktno kontaktirajući salon.
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-sm border-b md:sticky md:top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži po poziciji ili kompaniji..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* City Filter */}
            <div className="md:w-56 relative">
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  ref={cityInputRef}
                  type="text"
                  placeholder="Svi gradovi"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
                {citySearch ? (
                  <button
                    type="button"
                    onClick={clearCityFilter}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                ) : (
                  <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                )}
              </div>
              {showCityDropdown && filteredCities.length > 0 && (
                <div
                  ref={cityDropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {filteredCities.slice(0, 15).map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="w-full px-4 py-2 text-left hover:bg-pink-50 text-sm"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender Filter */}
            <div className="md:w-40">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Svi spolovi</option>
                <option value="male">Muškarac</option>
                <option value="female">Žena</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Pretraži
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Results count */}
          <div className="mb-6">
            <p className="text-gray-600">
              {loading ? 'Učitavanje...' : `Pronađeno ${totalAds} oglasa`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : jobAds.length === 0 ? (
            <div className="text-center py-16">
              <BriefcaseIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nema oglasa</h3>
              <p className="text-gray-500">Trenutno nema aktivnih oglasa za posao koji odgovaraju vašim kriterijima.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobAds.map((ad) => (
                <div 
                  key={ad.id} 
                  onClick={() => setSelectedAd(ad)}
                  className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
                >
                  {/* Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                        {ad.position_title}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getGenderBadgeColor(ad.gender_requirement)}`}>
                        {getGenderLabel(ad.gender_requirement)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <BuildingStorefrontIcon className="h-4 w-4 flex-shrink-0" />
                      {ad.salon ? (
                        <Link 
                          to={`/salon/${ad.salon.slug}`}
                          className="text-pink-600 hover:text-pink-700 font-medium truncate"
                        >
                          {ad.company_name}
                        </Link>
                      ) : (
                        <span className="font-medium truncate">{ad.company_name}</span>
                      )}
                    </div>

                    {ad.city && (
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                        <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{ad.city}</span>
                      </div>
                    )}

                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {ad.description}
                    </p>
                  </div>

                  {/* Deadline */}
                  {ad.deadline && (
                    <div className={`px-6 py-2 text-sm flex items-center gap-2 ${
                      isDeadlineExpired(ad.deadline) 
                        ? 'bg-red-50 text-red-600' 
                        : isDeadlineSoon(ad.deadline)
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-gray-50 text-gray-600'
                    }`}>
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>
                        {isDeadlineExpired(ad.deadline) 
                          ? 'Rok istekao' 
                          : `Rok prijave: ${formatDate(ad.deadline)}`
                        }
                      </span>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                      Kontakt za prijavu
                    </p>
                    <div className="space-y-2">
                      <a 
                        href={`mailto:${ad.contact_email}`}
                        className="flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm"
                      >
                        <EnvelopeIcon className="h-4 w-4" />
                        <span className="truncate">{ad.contact_email}</span>
                      </a>
                      {ad.contact_phone && (
                        <a 
                          href={`tel:${ad.contact_phone}`}
                          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm"
                        >
                          <PhoneIcon className="h-4 w-4" />
                          <span>{ad.contact_phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Posted date */}
                  <div className="px-6 py-2 bg-gray-50 border-t text-xs text-gray-400">
                    Objavljeno: {formatDate(ad.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prethodna
              </button>
              <span className="px-4 py-2 text-gray-600">
                Stranica {currentPage} od {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sljedeća
              </button>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />

      {/* Job Ad Detail Modal */}
      {selectedAd && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAd(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedAd.position_title}</h2>
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <BuildingStorefrontIcon className="h-4 w-4" />
                  {selectedAd.salon ? (
                    <Link 
                      to={`/salon/${selectedAd.salon.slug}`}
                      className="text-pink-600 hover:text-pink-700 font-medium"
                      onClick={() => setSelectedAd(null)}
                    >
                      {selectedAd.company_name}
                    </Link>
                  ) : (
                    <span className="font-medium">{selectedAd.company_name}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedAd(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGenderBadgeColor(selectedAd.gender_requirement)}`}>
                  {getGenderLabel(selectedAd.gender_requirement)}
                </span>
                {selectedAd.city && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {selectedAd.city}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Opis pozicije</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedAd.description}</p>
              </div>

              {/* Dates */}
              <div className="flex flex-wrap gap-6 text-sm">
                {selectedAd.deadline && (
                  <div className={`flex items-center gap-2 ${
                    isDeadlineExpired(selectedAd.deadline) 
                      ? 'text-red-600' 
                      : isDeadlineSoon(selectedAd.deadline)
                        ? 'text-yellow-700'
                        : 'text-gray-600'
                  }`}>
                    <CalendarDaysIcon className="h-5 w-5" />
                    <span>
                      {isDeadlineExpired(selectedAd.deadline) 
                        ? 'Rok prijave je istekao' 
                        : `Rok prijave: ${formatDate(selectedAd.deadline)}`
                      }
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <ClockIcon className="h-5 w-5" />
                  <span>Objavljeno: {formatDate(selectedAd.created_at)}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Kontakt za prijavu</h3>
                <div className="space-y-3">
                  <a 
                    href={`mailto:${selectedAd.contact_email}`}
                    className="flex items-center gap-3 text-pink-600 hover:text-pink-700 font-medium"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <EnvelopeIcon className="h-5 w-5" />
                    </div>
                    <span>{selectedAd.contact_email}</span>
                  </a>
                  {selectedAd.contact_phone && (
                    <a 
                      href={`tel:${selectedAd.contact_phone}`}
                      className="flex items-center gap-3 text-pink-600 hover:text-pink-700 font-medium"
                    >
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <PhoneIcon className="h-5 w-5" />
                      </div>
                      <span>{selectedAd.contact_phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedAd(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAdsPage;
