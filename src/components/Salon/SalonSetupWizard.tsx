import { useState, useEffect } from 'react';
import {
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Building,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salonAPI } from '../../services/api';
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

interface ValidationErrors {
  [key: string]: string;
}

interface SalonSetupWizardProps {
  onComplete: () => void;
}

export function SalonSetupWizard({ onComplete }: SalonSetupWizardProps) {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [salon, setSalon] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    city_slug: '',
    postal_code: '',
    country: 'Bosna i Hercegovina',
    phone: '',
    email: user?.email || '',
    website: '',
    latitude: null as number | null,
    longitude: null as number | null,
    location: { lat: 43.8563, lng: 18.4131 }, // Default Sarajevo
    target_audience: {
      women: true,
      men: true,
      children: true
    } as TargetAudience,
    working_hours: {
      monday: { open: '09:00', close: '17:00', is_open: true },
      tuesday: { open: '09:00', close: '17:00', is_open: true },
      wednesday: { open: '09:00', close: '17:00', is_open: true },
      thursday: { open: '09:00', close: '17:00', is_open: true },
      friday: { open: '09:00', close: '17:00', is_open: true },
      saturday: { open: '09:00', close: '15:00', is_open: true },
      sunday: { open: '10:00', close: '14:00', is_open: false }
    } as WorkingHours,
    auto_confirm: false,
    booking_slot_interval: 30
  });

  // Load existing salon data if available
  useEffect(() => {
    const loadSalonData = async () => {
      if (user?.salon?.id) {
        try {
          const salonData = await salonAPI.getSalon(user.salon.id);
          setSalon(salonData);
          setImages(salonData.images || []);

          setFormData(prev => ({
            ...prev,
            name: salonData.name || '',
            description: salonData.description || '',
            address: salonData.address || '',
            city: salonData.city || '',
            city_slug: salonData.city_slug || '',
            postal_code: salonData.postal_code || '',
            country: salonData.country || 'Bosna i Hercegovina',
            phone: salonData.phone || '',
            email: salonData.email || user?.email || '',
            website: salonData.website || '',
            latitude: salonData.latitude || null,
            longitude: salonData.longitude || null,
            location: salonData.location || { lat: 43.8563, lng: 18.4131 },
            target_audience: salonData.target_audience || prev.target_audience,
            working_hours: salonData.working_hours || prev.working_hours,
            auto_confirm: salonData.auto_confirm || false
          }));
        } catch (err) {
          console.error('Error loading salon:', err);
        }
      }
    };

    loadSalonData();
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Naziv salona je obavezan';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email je obavezan';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Unesite validan email';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Telefon je obavezan';
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Opis salona je obavezan';
      } else if (formData.description.trim().length < 20) {
        newErrors.description = 'Opis mora imati najmanje 20 karaktera';
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = 'Adresa je obavezna';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'Grad/Mjesto je obavezno';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save all data at once (on step 3 or when completing)
  const handleSaveAll = async () => {
    // Validate all steps before saving
    const allErrors: ValidationErrors = {};

    // Step 1 validation
    if (!formData.name.trim()) allErrors.name = 'Naziv salona je obavezan';
    if (!formData.email.trim()) allErrors.email = 'Email je obavezan';
    if (!formData.phone.trim()) allErrors.phone = 'Telefon je obavezan';
    if (!formData.description.trim()) allErrors.description = 'Opis salona je obavezan';

    // Step 2 validation
    if (!formData.address.trim()) allErrors.address = 'Adresa je obavezna';
    if (!formData.city.trim()) allErrors.city = 'Grad/Mjesto je obavezno';

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Go to the first step with errors
      if (allErrors.name || allErrors.email || allErrors.phone || allErrors.description) {
        setCurrentStep(1);
      } else if (allErrors.address || allErrors.city) {
        setCurrentStep(2);
      }
      return false;
    }

    setSaving(true);
    setErrors({});

    try {
      // Prepare data for API - ensure location has valid coordinates
      const dataToSend = {
        ...formData,
        location: {
          lat: formData.latitude || formData.location.lat || 43.8563,
          lng: formData.longitude || formData.location.lng || 18.4131
        }
      };

      let response;
      if (salon?.id) {
        response = await salonAPI.updateSalon(salon.id, dataToSend);
      } else {
        response = await salonAPI.createSalon(dataToSend);
      }

      const savedSalon = response.salon || response;
      setSalon(savedSalon);
      setSuccess('Podaci su uspješno sačuvani!');

      if (refreshUser) {
        await refreshUser();
      }

      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err: any) {
      console.error('Error saving salon:', err);

      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        const backendErrors: ValidationErrors = {};
        Object.entries(err.response.data.errors).forEach(([key, messages]: [string, any]) => {
          backendErrors[key] = Array.isArray(messages) ? messages[0] : messages;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: err.response?.data?.message || 'Greška prilikom čuvanja podataka' });
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // If salon doesn't exist yet, save it first
    if (!salon?.id) {
      const saved = await handleSaveAll();
      if (!saved) {
        setErrors({ general: 'Morate prvo sačuvati osnovne podatke prije uploada fotografija' });
        return;
      }
    }

    setUploadingImages(true);
    setErrors({});

    try {
      const formDataUpload = new FormData();
      Array.from(files).forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Datoteka ${file.name} je prevelika. Maksimalna veličina je 5MB.`);
        }
        // Laravel expects 'images[]' for array of files
        formDataUpload.append('images[]', file);
      });

      const response = await salonAPI.uploadImages(salon.id, formDataUpload);
      
      // Add newly uploaded images to the existing images array
      if (response.images && Array.isArray(response.images)) {
        setImages(prev => [...prev, ...response.images]);
      } else {
        // Fallback: reload salon data if response doesn't contain images
        const updatedSalon = await salonAPI.getSalon(salon.id);
        setImages(updatedSalon.images || []);
      }
      
      setSuccess('Fotografije su uspješno uploadovane!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setErrors({ general: err.message || 'Greška prilikom uploada fotografija' });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = async (imageId: string) => {
    if (!salon?.id) return;

    try {
      await salonAPI.deleteImage(salon.id, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err: any) {
      console.error('Error removing image:', err);
      setErrors({ general: 'Greška prilikom brisanja fotografije' });
    }
  };

  const handleComplete = async () => {
    // Save data first if not saved
    if (!salon?.id) {
      const saved = await handleSaveAll();
      if (!saved) return;
    }
    onComplete();
  };

  const handleSaveAndContinue = async () => {
    if (!validateStep(currentStep)) return;

    // On step 2, save all data
    if (currentStep === 2) {
      const saved = await handleSaveAll();
      if (saved) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      handleNext();
    }
  };

  const dayNames: Record<string, string> = {
    monday: 'Ponedjeljak',
    tuesday: 'Utorak',
    wednesday: 'Srijeda',
    thursday: 'Četvrtak',
    friday: 'Petak',
    saturday: 'Subota',
    sunday: 'Nedjelja'
  };

  const steps = [
    { number: 1, title: 'Osnovni podaci', icon: Building },
    { number: 2, title: 'Lokacija', icon: MapPin },
    { number: 3, title: 'Radno vrijeme', icon: Clock },
    { number: 4, title: 'Fotografije', icon: ImageIcon }
  ];

  const renderFieldError = (field: string) => {
    if (!errors[field]) return null;
    return (
      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {errors[field]}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Dobrodošli u Frizerino! 🎉
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Popunite podatke o vašem salonu kako bi klijenti mogli pronaći i rezervisati termine.
          </p>
        </div>

        {/* Progress Steps - Mobile */}
        <div className="flex sm:hidden justify-between items-center mb-6 px-2">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <div key={step.number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {isCompleted ? '✓' : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 mx-1 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Steps - Desktop */}
        <div className="hidden sm:flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Osnovni podaci o salonu
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Naziv salona <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="npr. Beauty Studio Marija"
                  />
                  {renderFieldError('name')}
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="info@salon.ba"
                    />
                  </div>
                  {renderFieldError('email')}
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+387 33 123 456"
                    />
                  </div>
                  {renderFieldError('phone')}
                </div>

                <div className="sm:col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (opciono)
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.mojsalon.ba"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis salona <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Opišite vaš salon, usluge koje nudite, atmosferu, iskustvo... (min. 20 karaktera)"
                />
                {renderFieldError('description')}
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/20 karaktera (minimum)
                </p>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kome je salon namijenjen
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_audience.women}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        target_audience: { ...prev.target_audience, women: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Žene</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_audience.men}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        target_audience: { ...prev.target_audience, men: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Muškarci</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.target_audience.children}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        target_audience: { ...prev.target_audience, children: e.target.checked }
                      }))}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Djeca</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Lokacija salona
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="npr. Ferhadija 15"
                  />
                  {renderFieldError('address')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grad / Mjesto <span className="text-red-500">*</span>
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
                        location: {
                          lat: location.latitude || prev.location.lat,
                          lng: location.longitude || prev.location.lng
                        }
                      }));
                      if (errors.city) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.city;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={false}
                  />
                  {renderFieldError('city')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poštanski broj
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="71000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zemlja
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Bosna i Hercegovina">Bosna i Hercegovina</option>
                    <option value="Srbija">Srbija</option>
                    <option value="Hrvatska">Hrvatska</option>
                    <option value="Crna Gora">Crna Gora</option>
                  </select>
                </div>
              </div>

              {/* Coordinates Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 Koordinate za mapu će biti automatski postavljene na osnovu odabranog grada.
                  Možete ih kasnije preciznije podesiti u profilu salona.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Working Hours */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Radno vrijeme
              </h2>

              <div className="space-y-3">
                {Object.entries(dayNames).map(([day, dayName]) => {
                  const dayHours = formData.working_hours[day as keyof WorkingHours];
                  return (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-full sm:w-28 font-medium text-gray-700">{dayName}</div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dayHours.is_open}
                          onChange={(e) => handleWorkingHoursChange(day, 'is_open', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Radi</span>
                      </label>

                      {dayHours.is_open && (
                        <div className="flex items-center gap-2 ml-0 sm:ml-4">
                          <input
                            type="time"
                            value={dayHours.open}
                            onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={dayHours.close}
                            onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Auto-confirm setting */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_confirm}
                    onChange={(e) => handleInputChange('auto_confirm', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Automatska potvrda termina</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Ako je uključeno, termini će biti automatski potvrđeni. Inače ćete morati ručno potvrditi svaki termin.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Fotografije salona
              </h2>

              {!salon?.id ? (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-yellow-800 font-medium">
                    Morate prvo sačuvati osnovne podatke
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Vratite se na prethodne korake i kliknite "Sačuvaj i nastavi".
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingImages ? (
                          <>
                            <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-500">Uploadovanje...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500 text-center px-4">
                              <span className="font-semibold">Kliknite za upload</span>
                              <span className="hidden sm:inline"> ili prevucite fotografije</span>
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG ili JPEG (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Uploadovane fotografije ({images.length}/20)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((image) => (
                          <div key={image.id} className="relative group aspect-square">
                            <img
                              src={image.url}
                              alt="Salon"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(image.id)}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {images.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Još niste uploadovali fotografije. Fotografije pomažu klijentima da vide vaš salon.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="order-2 sm:order-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Nazad
          </button>

          <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-3">
            {currentStep < 3 && (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Dalje
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Čuvanje...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sačuvaj i nastavi
                  </>
                )}
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={async () => {
                  if (salon?.id) {
                    await handleSaveAll();
                  }
                  setCurrentStep(4);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Čuvanje...
                  </>
                ) : (
                  <>
                    Dalje
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={handleComplete}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Završi podešavanje
              </button>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium">Šta se dešava nakon podešavanja?</p>
              <p className="text-blue-700 text-sm mt-1">
                Nakon što popunite podatke, vaš salon će biti poslan na pregled administratoru.
                Kada bude odobren, dobićete email obavijest i moći ćete dodavati usluge, zaposlene i primati rezervacije.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
