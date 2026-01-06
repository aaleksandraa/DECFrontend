import React, { useState, useEffect } from 'react';
import { 
  Save, 
  MapPin, 
  Clock, 
  Plus,
  X,
  Search,
  CheckCircle,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salonAPI } from '../../services/api';
import { LocationService } from '../../utils/locationUtils';
import { LocationPicker } from './LocationPicker';

type WorkingHoursDay = {
  open: string;
  close: string;
  is_open: boolean;
};

type WorkingHours = {
  monday: WorkingHoursDay;
  tuesday: WorkingHoursDay;
  wednesday: WorkingHoursDay;
  thursday: WorkingHoursDay;
  friday: WorkingHoursDay;
  saturday: WorkingHoursDay;
  sunday: WorkingHoursDay;
};

type TargetAudience = {
  women: boolean;
  men: boolean;
  children: boolean;
};

type SocialMedia = {
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  linkedin: string;
};

type SalonFormData = {
  name: string;
  description: string;
  address: string;
  city: string;
  city_slug: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  location: { lat: number; lng: number };
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string;
  target_audience: TargetAudience;
  working_hours: WorkingHours;
  amenities: string[];
  social_media: SocialMedia;
  auto_confirm: boolean;
  email_notifications_enabled: boolean;
  booking_slot_interval: number;
  show_service_gallery: boolean;
};

export function SalonProfile() {
  const { user } = useAuth();
  const [salon, setSalon] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<SalonFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationService] = useState(() => LocationService.getInstance());
  const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');

  const [formData, setFormData] = useState<SalonFormData>({
    name: '',
    description: '',
    address: '',
    city: '',
    city_slug: '',
    postal_code: '',
    country: 'Bosna i Hercegovina',
    phone: '',
    email: '',
    website: '',
    location: { lat: 0, lng: 0 },
    latitude: null,
    longitude: null,
    google_maps_url: '',
    target_audience: {
      women: true,
      men: true,
      children: true
    },
    working_hours: {
      monday: { open: '09:00', close: '17:00', is_open: true },
      tuesday: { open: '09:00', close: '17:00', is_open: true },
      wednesday: { open: '09:00', close: '17:00', is_open: true },
      thursday: { open: '09:00', close: '17:00', is_open: true },
      friday: { open: '09:00', close: '17:00', is_open: true },
      saturday: { open: '09:00', close: '15:00', is_open: true },
      sunday: { open: '10:00', close: '14:00', is_open: false }
    },
    amenities: [],
    social_media: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: '',
      linkedin: ''
    },
    auto_confirm: false,
    email_notifications_enabled: true,
    booking_slot_interval: 30,
    show_service_gallery: true
  });

  const [images, setImages] = useState<any[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSalonData();
  }, [user]);

  const loadSalonData = async () => {
    if (!user || user.role !== 'salon') return;

    try {
      setLoading(true);
      if (user.salon) {
        const salonData = await salonAPI.getSalon(user.salon.id);
        setSalon(salonData);
        setImages(salonData.images || []);
        const loadedData: SalonFormData = {
          name: salonData.name,
          description: salonData.description,
          address: salonData.address,
          city: salonData.city,
          city_slug: salonData.city_slug || '',
          postal_code: salonData.postal_code || '',
          country: salonData.country || 'Bosna i Hercegovina',
          phone: salonData.phone,
          email: salonData.email,
          website: salonData.website || '',
          target_audience: salonData.target_audience || {
            women: true,
            men: true,
            children: true
          },
          location: salonData.location || { lat: 0, lng: 0 },
          latitude: salonData.latitude || null,
          longitude: salonData.longitude || null,
          google_maps_url: salonData.google_maps_url || '',
          working_hours: salonData.working_hours || {
            monday: { open: '09:00', close: '17:00', is_open: true },
            tuesday: { open: '09:00', close: '17:00', is_open: true },
            wednesday: { open: '09:00', close: '17:00', is_open: true },
            thursday: { open: '09:00', close: '17:00', is_open: true },
            friday: { open: '09:00', close: '17:00', is_open: true },
            saturday: { open: '09:00', close: '15:00', is_open: true },
            sunday: { open: '10:00', close: '14:00', is_open: false }
          },
          amenities: salonData.amenities || [],
          social_media: salonData.social_media || { facebook: '', instagram: '', twitter: '', tiktok: '', linkedin: '' },
          auto_confirm: salonData.auto_confirm || false,
          email_notifications_enabled: salonData.email_notifications_enabled !== false,
          booking_slot_interval: salonData.booking_slot_interval || 30,
          show_service_gallery: salonData.show_service_gallery !== false
        };
        setFormData(loadedData);
        setOriginalFormData(JSON.parse(JSON.stringify(loadedData)));
        setLocationQuery(salonData.address);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...prev.working_hours[day as keyof WorkingHours],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
    setHasChanges(true);
  };

  const handleLocationSearch = async (query: string) => {
    if (query.length < 3) {
      setLocationSearchResults([]);
      return;
    }

    try {
      const results = await locationService.searchLocations(query, 'BA');
      setLocationSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
    }
  };

  const handleLocationSelect = async (result: any) => {
    try {
      const details = await locationService.getPlaceDetails(result.placeId);
      if (details) {
        setFormData(prev => ({
          ...prev,
          address: details.address,
          city: details.city,
          location: {
            lat: details.lat,
            lng: details.lng
          }
        }));
        setLocationQuery(details.address);
        setShowLocationSearch(false);
        setLocationSearchResults([]);
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
      setHasChanges(true);
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
    setHasChanges(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !salon) return;

    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Frontend validation
      const filesArray = Array.from(files);
      
      // Check file count
      if (filesArray.length > 10) {
        setUploadError('Možete uploadovati maksimalno 10 slika odjednom.');
        return;
      }

      // Check each file
      for (const file of filesArray) {
        // Check file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`Slika "${file.name}" je prevelika. Maksimalna veličina je 5MB.`);
          return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          setUploadError(`Slika "${file.name}" mora biti u formatu: JPEG, PNG ili WebP.`);
          return;
        }
      }

      const formDataUpload = new FormData();
      filesArray.forEach(file => {
        // Laravel expects 'images[]' for array of files
        formDataUpload.append('images[]', file);
      });

      const response = await salonAPI.uploadImages(salon.id, formDataUpload);
      
      // Add newly uploaded images to the existing images array immediately
      if (response.images && Array.isArray(response.images)) {
        setImages(prev => [...prev, ...response.images]);
        setUploadSuccess(`Uspješno uploadovano ${response.images.length} ${response.images.length === 1 ? 'slika' : 'slika'}!`);
        setTimeout(() => setUploadSuccess(null), 3000);
      } else {
        // Fallback: reload salon data if response doesn't contain images with URLs
        loadSalonData();
        setUploadSuccess('Slike su uspješno uploadovane!');
        setTimeout(() => setUploadSuccess(null), 3000);
      }

      // Clear the file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Error uploading images:', error);
      
      // Extract error message from server response
      let errorMessage = 'Greška prilikom uploada slika.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
    }
  };

  const removeImage = async (imageId: string) => {
    if (!salon) return;

    setUploadError(null);
    setUploadSuccess(null);

    try {
      await salonAPI.deleteImage(salon.id, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setUploadSuccess('Slika je uspješno obrisana!');
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error removing image:', error);
      
      let errorMessage = 'Greška prilikom brisanja slike.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setUploadError(errorMessage);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (salon) {
        // Update existing salon
        const response = await salonAPI.updateSalon(salon.id, formData);
        setSalon(response.salon);
        
        // Update formData with the response to ensure consistency
        const updatedData: SalonFormData = {
          name: response.salon.name,
          description: response.salon.description,
          address: response.salon.address,
          city: response.salon.city,
          city_slug: response.salon.city_slug || '',
          postal_code: response.salon.postal_code || '',
          country: response.salon.country || 'Bosna i Hercegovina',
          phone: response.salon.phone,
          email: response.salon.email,
          website: response.salon.website || '',
          target_audience: response.salon.target_audience || {
            women: true,
            men: true,
            children: true
          },
          location: response.salon.location || { lat: 0, lng: 0 },
          latitude: response.salon.latitude || null,
          longitude: response.salon.longitude || null,
          google_maps_url: response.salon.google_maps_url || '',
          working_hours: response.salon.working_hours || {
            monday: { open: '09:00', close: '17:00', is_open: true },
            tuesday: { open: '09:00', close: '17:00', is_open: true },
            wednesday: { open: '09:00', close: '17:00', is_open: true },
            thursday: { open: '09:00', close: '17:00', is_open: true },
            friday: { open: '09:00', close: '17:00', is_open: true },
            saturday: { open: '09:00', close: '15:00', is_open: true },
            sunday: { open: '10:00', close: '14:00', is_open: false }
          },
          amenities: response.salon.amenities || [],
          social_media: response.salon.social_media || { facebook: '', instagram: '', twitter: '', tiktok: '', linkedin: '' },
          auto_confirm: response.salon.auto_confirm || false,
          email_notifications_enabled: response.salon.email_notifications_enabled !== false,
          booking_slot_interval: response.salon.booking_slot_interval || 30,
          show_service_gallery: response.salon.show_service_gallery !== false
        };
        
        setFormData(updatedData);
        setOriginalFormData(JSON.parse(JSON.stringify(updatedData)));
        setHasChanges(false);
      } else {
        // Create new salon
        const response = await salonAPI.createSalon(formData);
        setSalon(response.salon);
        
        // Update formData with the response
        const updatedData: SalonFormData = {
          name: response.salon.name,
          description: response.salon.description,
          address: response.salon.address,
          city: response.salon.city,
          city_slug: response.salon.city_slug || '',
          postal_code: response.salon.postal_code || '',
          country: response.salon.country || 'Bosna i Hercegovina',
          phone: response.salon.phone,
          email: response.salon.email,
          website: response.salon.website || '',
          target_audience: response.salon.target_audience || {
            women: true,
            men: true,
            children: true
          },
          location: response.salon.location || { lat: 0, lng: 0 },
          latitude: response.salon.latitude || null,
          longitude: response.salon.longitude || null,
          google_maps_url: response.salon.google_maps_url || '',
          working_hours: response.salon.working_hours || {
            monday: { open: '09:00', close: '17:00', is_open: true },
            tuesday: { open: '09:00', close: '17:00', is_open: true },
            wednesday: { open: '09:00', close: '17:00', is_open: true },
            thursday: { open: '09:00', close: '17:00', is_open: true },
            friday: { open: '09:00', close: '17:00', is_open: true },
            saturday: { open: '09:00', close: '15:00', is_open: true },
            sunday: { open: '10:00', close: '14:00', is_open: false }
          },
          amenities: response.salon.amenities || [],
          social_media: response.salon.social_media || { facebook: '', instagram: '', twitter: '', tiktok: '', linkedin: '' },
          auto_confirm: response.salon.auto_confirm || false,
          email_notifications_enabled: response.salon.email_notifications_enabled !== false,
          booking_slot_interval: response.salon.booking_slot_interval || 30,
          show_service_gallery: response.salon.show_service_gallery !== false
        };
        
        setFormData(updatedData);
        setOriginalFormData(JSON.parse(JSON.stringify(updatedData)));
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving salon:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalFormData) {
      setFormData(JSON.parse(JSON.stringify(originalFormData)));
      setHasChanges(false);
    }
  };

  const dayNames = {
    monday: 'Ponedeljak',
    tuesday: 'Utorak',
    wednesday: 'Sreda',
    thursday: 'Četvrtak',
    friday: 'Petak',
    saturday: 'Subota',
    sunday: 'Nedelja'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {salon ? 'Profil salona' : 'Kreiranje profila salona'}
        </h1>
        {hasChanges && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Otkaži
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
          </div>
        )}
      </div>

      {salon && salon.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              Vaš salon je na čekanju odobrenja od strane administratora. 
              Biće vidljiv klijentima nakon odobrenja.
            </p>
          </div>
        </div>
      )}

      {salon && salon.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">
              Vaš salon je odobren i vidljiv je klijentima na platformi.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Osnovne informacije</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naziv salona *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Beauty Studio Marija"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="info@salon.rs"
                />
                <p className="mt-1 text-sm text-gray-500">
                  💡 Klijenti će moći odgovoriti direktno na ovaj email kada prime potvrdu termina
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="+387 33 123 456"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="https://salon.ba"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis salona *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Opišite vaš salon, usluge koje nudite, atmosferu..."
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokacija</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pretražite lokaciju
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    handleLocationSearch(e.target.value);
                    setShowLocationSearch(true);
                    setHasChanges(true);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unesite adresu ili naziv mesta..."
                />
                
                {showLocationSearch && locationSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSearchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{result.name}</div>
                        <div className="text-sm text-gray-600">{result.address}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresa *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Ferhadija 15"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grad / Mjesto *
                </label>
                <LocationPicker
                  value={formData.city}
                  onChange={(location) => {
                    setFormData(prev => ({
                      ...prev,
                      city: location.city,
                      city_slug: location.city_slug,
                      postal_code: location.postal_code || prev.postal_code,
                      latitude: location.latitude ?? prev.latitude,
                      longitude: location.longitude ?? prev.longitude,
                    }));
                    setHasChanges(true);
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poštanski broj
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="71000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zemlja
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="Bosna i Hercegovina">Bosna i Hercegovina</option>
                  <option value="Srbija">Srbija</option>
                  <option value="Hrvatska">Hrvatska</option>
                  <option value="Crna Gora">Crna Gora</option>
                  <option value="Slovenija">Slovenija</option>
                  <option value="Makedonija">Makedonija</option>
                </select>
              </div>
            </div>
            
            {/* Location Coordinates Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Koordinate lokacije (za prikaz na mapi)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Geografska širina (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                    
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                    placeholder="43.8563"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Geografska dužina (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                    
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                    placeholder="18.4131"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Google Maps link (opciono)</label>
                <input
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => handleInputChange('google_maps_url', e.target.value)}
                  
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                💡 Koordinate možete pronaći na <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a> - desni klik na lokaciju i kopirajte koordinate.
              </p>
              
              {formData.latitude && formData.longitude && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Mapa će se prikazati na javnom profilu salona
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {formData.location.lat !== 0 && formData.location.lng !== 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Stare koordinate (iz pretrage): {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Working Hours */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Radno vreme</h3>
            
            <div className="space-y-4">
              {formData.working_hours && Object.entries(dayNames).map(([day, dayName]) => {
                const dayHours = formData.working_hours[day as keyof WorkingHours];
                if (!dayHours) return null;
                return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-24">
                    <span className="text-sm font-medium text-gray-700">{dayName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dayHours.is_open}
                      onChange={(e) => handleWorkingHoursChange(day, 'is_open', e.target.checked)}
                      
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-600">Radi</span>
                  </div>
                  
                  {dayHours.is_open && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={dayHours.open}
                        onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                        
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-50"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="time"
                        value={dayHours.close}
                        onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                        
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-50"
                      />
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* Salon Images */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fotografije salona ({images.length}/20)
            </h3>
            
            {/* Error Message */}
            {uploadError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{uploadError}</span>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{uploadSuccess}</span>
              </div>
            )}
            
            {images.length < 20 && (
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Kliknite za upload</span> ili prevucite fotografije
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP (MAX. 5MB po slici, max 10 slika odjednom)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={`Salon fotografija ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Target Audience */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kome je salon namijenjen</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.target_audience?.women}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      target_audience: {
                        ...prev.target_audience,
                        women: e.target.checked
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Žene</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.target_audience?.men}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      target_audience: {
                        ...prev.target_audience,
                        men: e.target.checked
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Muškarci</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.target_audience?.children}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      target_audience: {
                        ...prev.target_audience,
                        children: e.target.checked
                      }
                    }));
                    setHasChanges(true);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Djeca</span>
              </label>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pogodnosti</h3>
            
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Dodaj pogodnost..."
                />
                <button
                  onClick={addAmenity}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {amenity}
                  <button
                    onClick={() => removeAmenity(amenity)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Društvene mreže</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  value={formData.social_media?.facebook || ''}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
                  placeholder="https://facebook.com/salon"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.social_media?.instagram || ''}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
                  placeholder="https://instagram.com/salon"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  X (Twitter)
                </label>
                <input
                  type="url"
                  value={formData.social_media?.twitter || ''}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
                  placeholder="https://x.com/salon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TikTok
                </label>
                <input
                  type="url"
                  value={formData.social_media?.tiktok || ''}
                  onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
                  placeholder="https://tiktok.com/@salon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.social_media?.linkedin || ''}
                  onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                  
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 text-sm"
                  placeholder="https://linkedin.com/company/salon"
                />
              </div>
            </div>
          </div>

          {/* Booking Settings */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Postavke rezervacija</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interval slotova za rezervaciju
                </label>
                <select
                  value={formData.booking_slot_interval}
                  onChange={(e) => handleInputChange('booking_slot_interval', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minuta</option>
                  <option value={30}>30 minuta (preporučeno)</option>
                  <option value={45}>45 minuta</option>
                  <option value={60}>60 minuta (1 sat)</option>
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  Određuje razmak između dostupnih termina za rezervaciju. Na primjer, ako je interval 30 minuta i radno vrijeme počinje u 7:00, slotovi će biti: 7:00, 7:30, 8:00, 8:30...
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_confirm}
                  onChange={(e) => handleInputChange('auto_confirm', e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900 block">Automatska potvrda termina</span>
                  <span className="text-sm text-gray-600">
                    Kad je uključeno, novi termini će automatski biti potvrđeni bez potrebe za ručnim odobravanjem.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.email_notifications_enabled}
                  onChange={(e) => handleInputChange('email_notifications_enabled', e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900 block">Email notifikacije o novim terminima</span>
                  <span className="text-sm text-gray-600">
                    Primajte email kada se zakaze novi termin. Obavještenja u aplikaciji će i dalje stizati.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.show_service_gallery}
                  onChange={(e) => handleInputChange('show_service_gallery', e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-900 block">Prikaži galeriju slika usluga</span>
                  <span className="text-sm text-gray-600">
                    Kad je uključeno, galerija slika usluga će biti prikazana na javnom profilu salona ispod svake usluge.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Status Information */}
          {salon && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status informacije</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    salon.status === 'approved' ? 'bg-green-100 text-green-800' :
                    salon.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {salon.status === 'approved' ? 'Odobren' :
                     salon.status === 'pending' ? 'Na čekanju' : 'Suspendovan'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Kreiran:</span>
                  <span className="text-gray-900">{salon.created_at}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Poslednja izmena:</span>
                  <span className="text-gray-900">{salon.updated_at}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Ocena:</span>
                  <span className="text-gray-900">
                    {salon.rating > 0 ? `${salon.rating}/5` : 'Nema ocena'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Broj recenzija:</span>
                  <span className="text-gray-900">{salon.review_count}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
