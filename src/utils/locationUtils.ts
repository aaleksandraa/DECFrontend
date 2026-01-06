import { LocationSearchResult } from '../types';

// Declare google as any to avoid type errors when @types/google.maps is not installed
declare const google: any;

// Google Places API utilities - Updated to use new Places API (2025)
export class LocationService {
  private static instance: LocationService;
  private geocoder: any = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeServices();
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  private initializeServices() {
    if (typeof google !== 'undefined' && google.maps) {
      this.geocoder = new google.maps.Geocoder();
      this.isInitialized = true;
    }
  }

  public async searchLocations(query: string, countryCode: string = 'BA'): Promise<LocationSearchResult[]> {
    if (!this.isInitialized || typeof google === 'undefined') {
      console.warn('Google Maps not initialized');
      return [];
    }

    try {
      // Use the new AutocompleteSuggestion API (recommended as of March 2025)
      const placesLib = await google.maps.importLibrary('places');
      const { AutocompleteSuggestion } = placesLib;
      
      const request = {
        input: query,
        includedRegionCodes: [countryCode],
        includedPrimaryTypes: ['establishment', 'geocode', 'locality', 'sublocality', 'neighborhood'],
      };

      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (!suggestions || suggestions.length === 0) {
        return [];
      }

      const results: LocationSearchResult[] = suggestions.map((suggestion: any) => {
        const placePrediction = suggestion.placePrediction;
        return {
          placeId: placePrediction?.placeId || '',
          name: placePrediction?.mainText?.text || '',
          address: placePrediction?.text?.text || '',
          city: this.extractCityFromPrediction(placePrediction),
          country: countryCode === 'BA' ? 'Bosna i Hercegovina' : '',
          lat: 0, // Will be filled by getPlaceDetails
          lng: 0  // Will be filled by getPlaceDetails
        };
      });

      return results;
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  public async getPlaceDetails(placeId: string): Promise<LocationSearchResult | null> {
    if (!this.isInitialized || typeof google === 'undefined') {
      console.warn('Google Maps not initialized');
      return null;
    }

    try {
      // Use the new Place API (recommended as of March 2025)
      const placesLib = await google.maps.importLibrary('places');
      const { Place } = placesLib;
      
      const place = new Place({
        id: placeId,
      });

      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
      });

      const result: LocationSearchResult = {
        placeId: placeId,
        name: place.displayName || '',
        address: place.formattedAddress || '',
        city: this.extractCityFromAddressComponents(place.addressComponents),
        country: this.extractCountryFromAddressComponents(place.addressComponents),
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0
      };

      return result;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  public async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!this.geocoder) {
        console.warn('Google Geocoder service not available');
        resolve(null);
        return;
      }

      this.geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  public async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  public calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private extractCityFromPrediction(placePrediction: any): string {
    if (!placePrediction?.secondaryText?.text) return '';
    // Secondary text usually contains city, region, country
    const parts = placePrediction.secondaryText.text.split(',');
    return parts[0]?.trim() || '';
  }

  private extractCityFromAddressComponents(components?: any[]): string {
    if (!components) return '';
    
    const cityComponent = components.find((component: any) => 
      component.types.includes('locality') || 
      component.types.includes('administrative_area_level_1')
    );
    
    return cityComponent?.longText || '';
  }

  private extractCountryFromAddressComponents(components?: any[]): string {
    if (!components) return '';
    
    const countryComponent = components.find((component: any) => 
      component.types.includes('country')
    );
    
    return countryComponent?.longText || '';
  }
}

// Utility functions for location formatting
export const formatAddress = (address: string, city: string, country: string): string => {
  const parts = [address, city, country].filter(Boolean);
  return parts.join(', ');
};

export const normalizeCity = (city: string): string => {
  return city.trim().toLowerCase().replace(/\s+/g, ' ');
};

export const normalizeCityForDisplay = (city: string): string => {
  return city.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getCountryCode = (country: string): string => {
  const countryMap: { [key: string]: string } = {
    'bosnia and herzegovina': 'BA',
    'bosna i hercegovina': 'BA',
    'serbia': 'RS',
    'srbija': 'RS',
    'croatia': 'HR',
    'hrvatska': 'HR',
    'montenegro': 'ME',
    'crna gora': 'ME',
    'slovenia': 'SI',
    'slovenija': 'SI',
    'north macedonia': 'MK',
    'makedonija': 'MK'
  };
  
  return countryMap[country.toLowerCase()] || 'BA';
};
