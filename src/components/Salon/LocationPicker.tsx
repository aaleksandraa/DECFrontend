import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { locationsAPI } from '../../services/api';
import { Location as LocationType, GroupedLocations } from '../../types';

interface LocationPickerProps {
  value: string;
  onChange: (location: {
    city: string;
    city_slug: string;
    postal_code: string;
    latitude: number | null;
    longitude: number | null;
    entity: string;
    canton: string | null;
    region: string | null;
  }) => void;
  disabled?: boolean;
  error?: string;
}

export function LocationPicker({ value, onChange, disabled = false, error }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [groupedLocations, setGroupedLocations] = useState<GroupedLocations | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'browse'>('search');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load grouped locations on mount
  useEffect(() => {
    loadGroupedLocations();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadGroupedLocations = async () => {
    try {
      const response = await locationsAPI.getGrouped();
      // Backend returns { grouped: {...} }
      setGroupedLocations(response.grouped || response.data || response);
    } catch (error) {
      console.error('Error loading grouped locations:', error);
    }
  };

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocations([]);
      return;
    }

    setLoading(true);
    try {
      const response = await locationsAPI.getAll({ search: query });
      // Backend returns { locations: [...] }
      const locationsList = response.locations || response.data || [];
      setLocations(locationsList);
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchLocations(query);
  };

  const selectLocation = (location: LocationType) => {
    onChange({
      city: location.name,
      city_slug: location.city_slug,
      postal_code: location.postal_code || '',
      latitude: location.latitude,
      longitude: location.longitude,
      entity: location.entity,
      canton: location.canton,
      region: location.region
    });
    setIsOpen(false);
    setSearchQuery('');
    setLocations([]);
  };

  const clearSelection = () => {
    onChange({
      city: '',
      city_slug: '',
      postal_code: '',
      latitude: null,
      longitude: null,
      entity: '',
      canton: null,
      region: null
    });
  };

  const renderLocationItem = (location: LocationType) => (
    <button
      key={location.id}
      onClick={() => selectLocation(location)}
      className="w-full text-left px-4 py-2.5 hover:bg-orange-50 flex items-center gap-3 transition-colors"
    >
      <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900">{location.name}</div>
        <div className="text-xs text-gray-500 truncate">
          {location.entity === 'BD' ? 'Brčko Distrikt' : (
            <>
              {location.entity} • {location.canton || location.region}
              {location.postal_code && ` • ${location.postal_code}`}
            </>
          )}
        </div>
      </div>
    </button>
  );

  const renderBrowseView = () => {
    if (!groupedLocations) return null;

    return (
      <div className="max-h-80 overflow-y-auto">
        {/* FBiH */}
        <div className="px-3 py-2 bg-blue-50 border-b">
          <span className="text-sm font-semibold text-blue-800">Federacija BiH</span>
        </div>
        {Object.entries(groupedLocations.FBiH || {}).map(([canton, locs]) => (
          <div key={canton}>
            <div className="px-4 py-1.5 bg-gray-50 border-b">
              <span className="text-xs font-medium text-gray-600">{canton}</span>
            </div>
            {(locs as LocationType[]).map(renderLocationItem)}
          </div>
        ))}

        {/* RS */}
        <div className="px-3 py-2 bg-red-50 border-b border-t">
          <span className="text-sm font-semibold text-red-800">Republika Srpska</span>
        </div>
        {Object.entries(groupedLocations.RS || {}).map(([region, locs]) => (
          <div key={region}>
            <div className="px-4 py-1.5 bg-gray-50 border-b">
              <span className="text-xs font-medium text-gray-600">{region}</span>
            </div>
            {(locs as LocationType[]).map(renderLocationItem)}
          </div>
        ))}

        {/* BD */}
        {groupedLocations.BD && groupedLocations.BD.length > 0 && (
          <>
            <div className="px-3 py-2 bg-yellow-50 border-b border-t">
              <span className="text-sm font-semibold text-yellow-800">Brčko Distrikt</span>
            </div>
            {(groupedLocations.BD as LocationType[]).map(renderLocationItem)}
          </>
        )}
      </div>
    );
  };

  if (disabled) {
    return (
      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
        {value || 'Nije odabrano'}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected value display / trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between gap-2 transition-colors ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-orange-500'
        } focus:ring-2 focus:border-transparent bg-white`}
      >
        <div className="flex items-center gap-2">
          <MapPin className={`w-4 h-4 ${value ? 'text-orange-500' : 'text-gray-400'}`} />
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value || 'Odaberite mjesto'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  clearSelection();
                }
              }}
            >
              <X className="w-4 h-4 text-gray-400" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setViewMode('search')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'search'
                  ? 'text-orange-600 bg-orange-50 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4" />
              Pretraga
            </button>
            <button
              type="button"
              onClick={() => setViewMode('browse')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'browse'
                  ? 'text-orange-600 bg-orange-50 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Pregledaj sve
            </button>
          </div>

          {viewMode === 'search' ? (
            <>
              {/* Search input */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Unesite naziv mjesta ili poštanski broj..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search results */}
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Tražim...
                  </div>
                ) : locations.length > 0 ? (
                  locations.map(renderLocationItem)
                ) : searchQuery.length >= 2 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Nema rezultata za "{searchQuery}"
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    Unesite najmanje 2 znaka za pretragu
                  </div>
                )}
              </div>
            </>
          ) : (
            renderBrowseView()
          )}
        </div>
      )}
    </div>
  );
}
