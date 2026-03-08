import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicAPI, appointmentAPI } from '../../services/api';
import { Service, Staff, User, Break, Vacation } from '../../types';
import SuccessModal from '../Common/SuccessModal';
import { ServiceSelector } from '../Common/ServiceSelector';
import { 
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  ScissorsIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface WorkingHours {
  [key: string]: { open: string; close: string; is_open: boolean };
}

interface GuestBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: {
    id: number;
    name: string;
    slug?: string;
    working_hours?: WorkingHours;
    salon_breaks?: Break[];
    salon_vacations?: Vacation[];
  };
  services: Service[];
  staff: Staff[];
  preselectedService?: Service;
  preselectedStaff?: Staff;
  user?: User | null;
  isWidget?: boolean; // Skip step 0 on widget
}

interface GuestData {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_address: string;
}

interface ValidationErrors {
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_address?: string;
}

interface SelectedServiceItem {
  id: string;
  service: Service | null;
}

export const GuestBookingModal: React.FC<GuestBookingModalProps> = ({
  isOpen,
  onClose,
  salon,
  services,
  staff,
  preselectedService,
  preselectedStaff,
  user,
  isWidget = false
}) => {
  const navigate = useNavigate();
  

  
  // Step management: 0=choice (guest only, skip on widget), 1=services, 2=staff, 3=date+time, 4=guest-info (guest only)
  // On widget, always start at step 1 (skip choice screen)
  const [step, setStep] = useState(user ? 1 : (isWidget ? 1 : 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // CRITICAL: Track if only zero-duration services are selected
  const [isZeroDurationOnly, setIsZeroDurationOnly] = useState(false);
  
  // Multi-service selection - ONE staff for ALL services
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  
  // Booking data
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Calendar navigation - current displayed month
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Track dates with available slots
  const [datesWithSlots, setDatesWithSlots] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [hasReliableDatesData, setHasReliableDatesData] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [capacityData, setCapacityData] = useState<Map<string, any>>(new Map());

  // Guest data
  const [guestData, setGuestData] = useState<GuestData>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_address: ''
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);

  // Initialize with preselected service
  useEffect(() => {
    if (isOpen) {
      // On widget, always start at step 1 (skip choice screen)
      setStep(user ? 1 : (isWidget ? 1 : 0));
      setError(null);
      setValidationErrors({});
      setShowSuccess(false);
      setCreatedAppointment(null);
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
      setAvailableSlots([]);
      setDatesWithSlots(new Set());
      setHasReliableDatesData(false);
      setSelectedStaffId(preselectedStaff?.id ? String(preselectedStaff.id) : '');
      
      // Initialize services
      if (preselectedService) {
        setSelectedServices([{
          id: String(preselectedService.id),
          service: preselectedService
        }]);
      } else {
        setSelectedServices([{ id: '', service: null }]);
      }
      
      // Pre-fill guest data
      if (user) {
        setGuestData({
          guest_name: user.name || '',
          guest_email: user.email || '',
          guest_phone: user.phone || '',
          guest_address: user.city || ''
        });
      } else {
        setGuestData({ guest_name: '', guest_email: '', guest_phone: '', guest_address: '' });
      }
    }
  }, [isOpen, user, preselectedService, preselectedStaff]);

  // Load available slots when staff, service, and date are selected
  useEffect(() => {
    if (selectedStaffId && selectedServices[0]?.id && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedServices, selectedDate, selectedStaffId]);

  // CRITICAL: Auto-show error and update isZeroDurationOnly when only zero-duration services are selected
  useEffect(() => {
    const hasAnyService = selectedServices.some(item => item.id);
    const totalDur = selectedServices.reduce((total, item) => {
      const dur = Number(item.service?.duration) || 0;
      return total + dur;
    }, 0);
    
    const isZeroOnly = hasAnyService && totalDur === 0;
    setIsZeroDurationOnly(isZeroOnly);
    
    if (step === 1 && isZeroOnly) {
      setError('Ne možete rezervisati ovu uslugu samostalno. Molimo dodajte glavnu uslugu.');
    }
  }, [selectedServices, step]);

  // Load dates with available slots when staff and services are selected
  useEffect(() => {
    if (selectedStaffId && selectedServices[0]?.id && step === 3) {
      setDatesWithSlots(new Set()); // Reset before loading
      setHasReliableDatesData(false);
      loadDatesWithSlots();
    }
  }, [selectedStaffId, selectedServices, step, currentMonth]);

  const loadDatesWithSlots = async () => {
    if (!selectedStaffId || !selectedServices[0]?.id) {
      return;
    }
    
    setLoadingDates(true);
    setLoadingProgress(0);
    setHasReliableDatesData(false);
    try {
      // Current time for filtering today's slots
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
      
      // Format month for API (YYYY-MM)
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      
      // Load capacity data for the month
      try {
        const capacityResponse = await publicAPI.getMonthCapacity(String(salon.id), monthStr);
        const capacityMap = new Map();
        capacityResponse.capacity.forEach((item: any) => {
          capacityMap.set(item.date, item);
        });
        setCapacityData(capacityMap);
      } catch (err) {
        // Silently handle capacity loading errors
      }
      
      // Build services data for API
      const servicesData = selectedServices
        .filter(s => s.id && s.service)
        .map(s => ({
          serviceId: s.id,
          staffId: selectedStaffId,
          duration: Number(s.service?.duration) || 0
        }));

      setLoadingProgress(30);

      // OPTIMIZED: Single API call to get all available dates for the month
      try {
        const response = await publicAPI.getAvailableDatesForMonth(String(salon.id), {
          staff_id: Number(selectedStaffId),
          month: monthStr,
          services: servicesData
        });
        
        setLoadingProgress(80);
        
        // Convert available dates to Set
        const datesSet = new Set<string>();
        
        // Check what format the API returns
        let availableDates = [];
        if (response.available_dates) {
          availableDates = response.available_dates;
        } else if (response.dates) {
          // If dates is array of objects with 'date' property, extract dates
          if (response.dates.length > 0 && typeof response.dates[0] === 'object') {
            availableDates = response.dates
              .filter((d: any) => d.available)
              .map((d: any) => d.date);
          } else {
            availableDates = response.dates;
          }
        }
        
        // Filter out today's date if no slots are available after current time
        // (backend doesn't know current time, so we need to check today separately)
        for (const dateStr of availableDates) {
          // Convert from YYYY-MM-DD to DD.MM.YYYY format
          let formattedDate = dateStr;
          if (dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            formattedDate = `${day}.${month}.${year}`;
          }
          
          if (formattedDate === todayStr) {
            // For today, we need to verify there are slots after current time
            try {
              const slotsResponse = await publicAPI.getAvailableSlotsForMultipleServices(
                String(salon.id),
                formattedDate,
                servicesData
              );
              const slots = (slotsResponse.slots || []).filter((slot: string) => slot > currentTimeStr);
              if (slots.length > 0) {
                datesSet.add(formattedDate);
              }
            } catch {
              // If error, still add the date (backend said it's available)
              datesSet.add(formattedDate);
            }
          } else {
            datesSet.add(formattedDate);
          }
        }
        
        setLoadingProgress(100);
        setDatesWithSlots(datesSet);
        setHasReliableDatesData(true);
      } catch (err: any) {
        // Fallback: if the optimized endpoint fails, dates will remain empty
        // User can still click on dates and check slots directly.
        setDatesWithSlots(new Set());
        setHasReliableDatesData(false);
      }
    } catch (err) {
      // Silently handle errors
    } finally {
      setLoadingDates(false);
      setLoadingProgress(0);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedStaffId || !selectedServices[0]?.id || !selectedDate) {
      return;
    }
    
    setLoadingSlots(true);
    try {
      // Build services data for multi-service API
      const servicesData = selectedServices
        .filter(s => s.id && s.service)
        .map(s => ({
          serviceId: s.id,
          staffId: selectedStaffId,
          duration: s.service?.duration || 0
        }));

      const response = await publicAPI.getAvailableSlotsForMultipleServices(
        String(salon.id),
        selectedDate,
        servicesData
      );
      
      let slots = response.slots || [];
      
      // Filter past slots if today
      const today = new Date();
      const [day, month, year] = selectedDate.split('.').map(Number);
      const selectedDateObj = new Date(year, month - 1, day);
      
      if (selectedDateObj.toDateString() === today.toDateString()) {
        const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
        slots = slots.filter((slot: string) => slot > currentTime);
      }
      
      setAvailableSlots(slots);
    } catch (err: any) {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Service management functions
  const addService = () => {
    setSelectedServices(prev => [...prev, { id: '', service: null }]);
  };

  const removeService = (index: number) => {
    const newServices = selectedServices.filter((_, i) => i !== index);
    
    // Check if remaining services have total duration > 0
    const remainingDuration = newServices.reduce((total, item) => total + (Number(item.service?.duration) || 0), 0);
    
    // If only 0-duration services remain, show warning
    if (newServices.length > 0 && remainingDuration === 0) {
      setError('Ne možete rezervisati samo dodatne usluge. Molimo dodajte glavnu uslugu.');
    } else {
      setError(null);
    }
    
    setSelectedServices(newServices);
    // Reset staff if they can't do remaining services
    setSelectedStaffId('');
  };

  const updateService = (index: number, serviceId: string) => {
    const foundService = services.find(s => String(s.id) === String(serviceId));
    
    if (!foundService) {
      setError('Usluga nije pronađena');
      return;
    }
    
    // Normalize service with numeric duration
    const service = {
      ...foundService,
      duration: Number(foundService.duration) || 0
    };
    
    // CRITICAL: Prevent selecting 0-duration service if it would result in total duration = 0
    if (service.duration === 0) {
      // Calculate what total duration would be after this selection
      const otherServicesDuration = selectedServices
        .filter((_, i) => i !== index)
        .reduce((total, item) => total + (Number(item.service?.duration) || 0), 0);
      
      if (otherServicesDuration === 0) {
        setError('Ne možete rezervisati ovu uslugu samostalno. Molimo prvo dodajte glavnu uslugu.');
        return; // Don't allow selection
      }
    }
    
    // Calculate what total duration would be after this selection
    const newServices = selectedServices.map((item, i) => 
      i === index ? { ...item, id: serviceId, service: service } : item
    );
    const newTotalDuration = newServices.reduce((total, item) => {
      return total + (Number(item.service?.duration) || 0);
    }, 0);
    
    // Show warning if only 0-duration services would remain
    if (newTotalDuration === 0 && newServices.some(s => s.id)) {
      setError('Ne možete rezervisati samo dodatne usluge. Molimo dodajte glavnu uslugu.');
    } else {
      setError(null);
    }
    
    setSelectedServices(newServices);
    // Reset staff selection when services change
    setSelectedStaffId('');
  };

  // Get staff who can perform ALL selected services
  const getAvailableStaffForAllServices = () => {
    const validServices = selectedServices.filter(s => s.id && s.service);
    if (validServices.length === 0) return staff;
    
    return staff.filter(staffMember => 
      validServices.every(item => {
        const staffIds = item.service?.staff_ids?.map(id => String(id)) || [];
        return staffIds.includes(String(staffMember.id));
      })
    );
  };

  // Auto-select staff if only one available (but don't skip the step)
  useEffect(() => {
    const availableStaff = getAvailableStaffForAllServices();
    if (availableStaff.length === 1 && !selectedStaffId) {
      setSelectedStaffId(String(availableStaff[0].id));
    }
  }, [selectedServices, staff]);

  const getTotalDuration = () => {
    // Calculate directly to avoid stale memoized values
    return selectedServices.reduce((total, item) => {
      return total + (Number(item.service?.duration) || 0);
    }, 0);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((total, item) => {
      const price = item.service?.discount_price || item.service?.price || 0;
      return total + price;
    }, 0);
  };

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is available (not on vacation, not a closed day)
  const isDateAvailable = (date: Date): { available: boolean; reason?: string } => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    
    // Check salon working hours
    if (salon.working_hours) {
      const dayHours = salon.working_hours[dayName];
      if (!dayHours || !dayHours.is_open) {
        return { available: false, reason: 'Neradni dan' };
      }
    }
    
    // Format date for comparison
    
    // Check salon vacations
    if (salon.salon_vacations && salon.salon_vacations.length > 0) {
      for (const vacation of salon.salon_vacations) {
        if (!vacation.is_active) continue;
        const startDate = parseDate(vacation.start_date);
        const endDate = parseDate(vacation.end_date);
        if (startDate && endDate && date >= startDate && date <= endDate) {
          return { available: false, reason: vacation.title || 'Godišnji odmor' };
        }
      }
    }
    
    // Check salon breaks (for specific date or date range)
    if (salon.salon_breaks && salon.salon_breaks.length > 0) {
      for (const breakItem of salon.salon_breaks) {
        if (!breakItem.is_active) continue;
        
        // Specific date break
        if (breakItem.type === 'specific_date' && breakItem.date) {
          const breakDate = parseDate(breakItem.date);
          if (breakDate && date.toDateString() === breakDate.toDateString()) {
            return { available: false, reason: breakItem.title || 'Pauza' };
          }
        }
        
        // Date range break
        if (breakItem.type === 'date_range' && breakItem.start_date && breakItem.end_date) {
          const startDate = parseDate(breakItem.start_date);
          const endDate = parseDate(breakItem.end_date);
          if (startDate && endDate && date >= startDate && date <= endDate) {
            return { available: false, reason: breakItem.title || 'Pauza' };
          }
        }
      }
    }
    
    // Check selected staff vacations/breaks if staff is selected
    if (selectedStaffId) {
      const selectedStaffMember = staff.find(s => String(s.id) === String(selectedStaffId));
      if (selectedStaffMember) {
        // Check staff working hours
        if (selectedStaffMember.working_hours) {
          const staffDayHours = selectedStaffMember.working_hours[dayName];
          if (!staffDayHours || !staffDayHours.is_working) {
            return { available: false, reason: 'Frizer ne radi' };
          }
        }
      }
    }
    
    return { available: true };
  };
  
  // Helper to parse date from dd.mm.yyyy or yyyy-mm-dd format
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const normalized = dateStr.trim().replace(/\.$/, '');
    
    // Try dd.mm.yyyy format
    if (normalized.includes('.')) {
      const [day, month, year] = normalized.split('.').map(Number);
      if (day && month && year) {
        return new Date(year, month - 1, day);
      }
    }
    
    // Try yyyy-mm-dd format
    if (normalized.includes('-')) {
      const [year, month, day] = normalized.split('-').map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day);
      }
    }
    
    return null;
  };

  // Validate guest data
  const validateGuestData = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Name validation
    if (!guestData.guest_name.trim()) {
      errors.guest_name = 'Ime i prezime je obavezno';
    } else if (guestData.guest_name.trim().length < 3) {
      errors.guest_name = 'Ime mora imati najmanje 3 karaktera';
    } else if (!/^[a-zA-ZčćžšđČĆŽŠĐ\s]+$/.test(guestData.guest_name)) {
      errors.guest_name = 'Ime može sadržati samo slova';
    }
    
    // Phone validation
    if (!guestData.guest_phone.trim()) {
      errors.guest_phone = 'Broj telefona je obavezan';
    } else {
      const phoneDigits = guestData.guest_phone.replace(/[\s\-\+\(\)]/g, '');
      if (!/^\d{8,15}$/.test(phoneDigits)) {
        errors.guest_phone = 'Unesite ispravan broj telefona (8-15 cifara)';
      }
    }
    
    // Address is optional - no validation needed
    
    // Email validation (optional but must be valid if provided)
    if (guestData.guest_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestData.guest_email)) {
        errors.guest_email = 'Unesite ispravnu email adresu';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step validation - CRITICAL: Block if only zero-duration services selected
  const canProceed = () => {
    switch (step) {
      case 1: {
        const hasAllServices = selectedServices.length > 0 && selectedServices.every(item => item.id);
        // CRITICAL: Calculate duration directly here to avoid stale memoized values
        const calculatedDuration = selectedServices.reduce((total, item) => {
          const dur = Number(item.service?.duration) || 0;
          return total + dur;
        }, 0);
        // Must have services AND total duration > 0 (not just addon services)
        const canGo = hasAllServices && calculatedDuration > 0;
        return canGo;
      }
      case 2: return !!selectedStaffId;
      case 3: return !!selectedDate && !!selectedTime;
      case 4: return guestData.guest_name && guestData.guest_phone;
      default: return false;
    }
  };

  const handleNext = () => {
    // Clear previous errors
    setError(null);
    setValidationErrors({});
    
    // Step-specific validation
    if (step === 1) {
      if (selectedServices.length === 0) {
        setError('Molimo izaberite najmanje jednu uslugu');
        return;
      }
      if (!selectedServices.every(item => item.id)) {
        setError('Molimo izaberite uslugu za sve stavke');
        return;
      }
      
      // VALIDATION: Calculate duration directly to avoid stale values
      const calculatedDuration = selectedServices.reduce((total, item) => {
        return total + (Number(item.service?.duration) || 0);
      }, 0);
      
      if (calculatedDuration === 0) {
        setError('Ne možete rezervisati ovu uslugu samostalno. Molimo dodajte glavnu uslugu.');
        return;
      }
    } else if (step === 2) {
      if (!selectedStaffId) {
        setError('Molimo izaberite frizera/kozmetičara');
        return;
      }
    } else if (step === 3) {
      if (!selectedDate) {
        setError('Molimo izaberite datum');
        return;
      }
      if (!selectedTime) {
        setError('Molimo izaberite vrijeme');
        return;
      }
    } else if (step === 4) {
      // Validate guest data
      if (!validateGuestData()) {
        setError('Molimo ispravite greške u formi');
        return;
      }
    }
    
    if (step === 1) {
      // Always go to staff selection step - never skip it
      setStep(2);
    } else if (step === 3) {
      // After date+time selection
      if (user) {
        handleSubmit();
      } else {
        setStep(4); // Go to guest info
      }
    } else if (step === 4) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    // On widget, don't go back to step 0 (choice screen doesn't exist)
    if (step === 1 && !user && !isWidget) {
      setStep(0);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create ONE appointment with all services
      const serviceIds = selectedServices.map(s => s.id);
      
      // Prepare base appointment data
      const baseData: any = {
        salon_id: salon.id,
        staff_id: Number(selectedStaffId),
        date: selectedDate,
        time: selectedTime,
        notes
      };
      
      // Send service_id for single service, services array for multiple
      if (serviceIds.length === 1) {
        baseData.service_id = Number(serviceIds[0]);
      } else {
        baseData.services = serviceIds.map(id => ({ id: Number(id) }));
      }
      
      // Add user-specific or guest-specific data
      const appointmentData = {
        ...baseData,
        ...(user ? {} : {
          guest_name: guestData.guest_name,
          guest_email: guestData.guest_email || undefined,
          guest_phone: guestData.guest_phone,
          guest_address: guestData.guest_address
        })
      };
      
      let response;
      if (user) {
        response = await appointmentAPI.createAppointment(appointmentData);
      } else {
        response = await publicAPI.bookAsGuest(appointmentData);
      }
      
      const appointment = response.appointment || response;
      setCreatedAppointment(appointment);
      setShowSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Greška pri rezervaciji. Pokušajte ponovo.';
      
      // Check if it's a double booking error - go back to time selection
      if (errorMessage.includes('upravo zauzet') || errorMessage.includes('nije dostupan') || errorMessage.includes('double booking')) {
        setError('Neko je u međuvremenu zakazao ovaj termin. Molimo odaberite drugo vrijeme.');
        setSelectedTime(''); // Clear selected time
        setStep(3); // Go back to date/time selection
        // Reload available slots
        loadAvailableSlots();
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['', 'Izaberite usluge', 'Izaberite frizera / kozmetičara', 'Izaberite datum i vrijeme', 'Vaši podaci'];

  if (!isOpen) return null;

  // Success Modal
  if (showSuccess && createdAppointment) {
    return (
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setCreatedAppointment(null);
          onClose();
        }}
        appointment={createdAppointment}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full h-screen h-[100dvh] sm:h-auto sm:max-h-[95vh] sm:max-w-2xl rounded-none sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-4 z-10 shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Rezervacija termina</h2>
              {user && (
                <p className="text-sm text-gray-500">Prijavljeni ste kao {user.name}</p>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </button>
          </div>
          
          {/* Progress Steps - only show for active booking steps */}
          {step >= 1 && step <= (user ? 3 : 4) && (
            <>
              <div className="flex items-center">
                {[1, 2, 3, ...(user ? [] : [4])].map((stepNum) => (
                  <React.Fragment key={stepNum}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step > stepNum ? <CheckCircleIcon className="w-5 h-5" /> : stepNum}
                    </div>
                    {stepNum < (user ? 3 : 4) && (
                      <div className={`flex-1 h-1 mx-1 sm:mx-2 ${step > stepNum ? 'bg-orange-500' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">{stepTitles[step]}</p>
            </>
          )}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 pb-8 sm:pb-6">
          {/* Step 0: Choice (Guest Only) */}
          {step === 0 && (
            <div className="py-4">
              <p className="text-gray-600 text-center mb-6">Kako želite nastaviti s rezervacijom?</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => { onClose(); navigate('/login', { state: { returnTo: `/salon/${salon.slug || salon.id}` } }); }}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200">
                    <ArrowRightOnRectangleIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900">Prijavite se</h3>
                    <p className="text-sm text-gray-500">Imate račun? Prijavite se za pristup svim terminima</p>
                  </div>
                </button>

                <button
                  onClick={() => { onClose(); navigate('/register', { state: { returnTo: `/salon/${salon.slug || salon.id}` } }); }}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
                    <UserPlusIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900">Registrujte se</h3>
                    <p className="text-sm text-gray-500">Kreirajte račun i pratite sve svoje termine</p>
                  </div>
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500">ili</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200">
                    <UserIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900">Nastavi kao gost</h3>
                    <p className="text-sm text-gray-500">Brza rezervacija bez registracije</p>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 text-center">
                  <strong>Zašto se registrovati?</strong><br />
                  Pregled svih termina • Podsjetnici putem emaila • Brža rezervacija
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <ScissorsIcon className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold">Odaberite usluge</h3>
              </div>
              
              <div className="space-y-4">
                {selectedServices.map((selectedService, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Usluga {index + 1}</span>
                      {selectedServices.length > 1 && (
                        <button
                          onClick={() => removeService(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <ServiceSelector
                      services={services}
                      selectedServiceId={selectedService.id}
                      onSelect={(serviceId) => updateService(index, serviceId)}
                      label="Pretražite ili odaberite uslugu"
                      excludeZeroDuration={index === 0}
                    />
                    
                    {selectedService.service?.description && (
                      <p className="mt-2 text-sm text-gray-500">{selectedService.service.description}</p>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={addService}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Dodaj još jednu uslugu
                </button>
                
                {selectedServices.some(item => item.id) && getTotalDuration() > 0 && (
                  <div className="rounded-xl p-4 bg-orange-50">
                    <div className="w-full">
                      <p className="text-sm text-gray-600">Ukupno trajanje: <strong>{getTotalDuration()} min</strong></p>
                      <p className="text-sm text-gray-600">Ukupna cijena: <strong className="text-orange-600">{getTotalPrice()} KM</strong></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Staff Selection - ONE staff for ALL services */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <UserGroupIcon className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold">Odaberite frizera / kozmetičara</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Izaberite frizera koji će obaviti sve vaše usluge ({getTotalDuration()} min ukupno)
              </p>
              
              {(() => {
                const availableStaff = getAvailableStaffForAllServices();
                
                if (availableStaff.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">Nema frizera koji može obaviti sve izabrane usluge.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {availableStaff.map((staffMember) => (
                      <button
                        key={staffMember.id}
                        onClick={() => setSelectedStaffId(String(staffMember.id))}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          selectedStaffId === String(staffMember.id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                            {staffMember.avatar ? (
                              <img src={staffMember.avatar} alt={staffMember.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <UserIcon className="w-6 h-6 text-orange-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{staffMember.name}</p>
                            <p className="text-sm text-gray-500">{staffMember.role || 'Frizer'}</p>
                            {staffMember.review_count > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-yellow-600">★ {staffMember.rating}</span>
                                <span className="text-xs text-gray-500">({staffMember.review_count} recenzija)</span>
                              </div>
                            )}
                          </div>
                          {selectedStaffId === String(staffMember.id) && (
                            <CheckCircleSolid className="w-6 h-6 text-orange-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 3: Date and Time Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDaysIcon className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold">Odaberite datum i vrijeme</h3>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 sm:p-5">
                {loadingDates && (
                  <div className="py-4 mb-4 bg-white rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm text-gray-600">Provjeravam dostupne termine...</span>
                    </div>
                    {loadingProgress > 0 && (
                      <div className="px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">{loadingProgress}%</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Custom date picker with month navigation */}
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const dayNames = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
                  const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
                  
                  // Max date is 3 months from now
                  const maxDate = new Date(today);
                  maxDate.setMonth(maxDate.getMonth() + 3);
                  
                  // Get first day of current displayed month
                  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                  
                  // Find the Monday before or on the first day of month
                  const startOfCalendar = new Date(firstDayOfMonth);
                  const dayOfWeek = startOfCalendar.getDay();
                  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  startOfCalendar.setDate(startOfCalendar.getDate() - daysFromMonday);
                  
                  // Get last day of current month
                  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                  
                  // Generate calendar days - only current month days
                  const calendarDays: (Date | null)[] = [];
                  
                  // Add empty slots for days before the 1st of month
                  for (let i = 0; i < daysFromMonday; i++) {
                    calendarDays.push(null);
                  }
                  
                  // Add all days of current month
                  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
                    calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                  }
                  
                  // Group into weeks
                  const weeks: (Date | null)[][] = [];
                  for (let i = 0; i < calendarDays.length; i += 7) {
                    weeks.push(calendarDays.slice(i, i + 7));
                  }
                  
                  const formatDateValue = (date: Date) => {
                    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
                  };
                  
                  // Check if we can go to previous month
                  const canGoPrev = currentMonth.getFullYear() > today.getFullYear() || 
                    (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth());
                  
                  // Check if we can go to next month
                  const canGoNext = currentMonth.getFullYear() < maxDate.getFullYear() || 
                    (currentMonth.getFullYear() === maxDate.getFullYear() && currentMonth.getMonth() < maxDate.getMonth());
                  
                  const goToPrevMonth = () => {
                    if (canGoPrev) {
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                    }
                  };
                  
                  const goToNextMonth = () => {
                    if (canGoNext) {
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                    }
                  };
                  
                  return (
                    <div className="space-y-4">
                      {/* Month/Year header with navigation */}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={goToPrevMonth}
                          disabled={!canGoPrev}
                          className={`p-2 rounded-lg transition-colors ${
                            canGoPrev 
                              ? 'hover:bg-gray-200 text-gray-700' 
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center font-semibold text-gray-800 text-lg">
                          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </div>
                        
                        <button
                          type="button"
                          onClick={goToNextMonth}
                          disabled={!canGoNext}
                          className={`p-2 rounded-lg transition-colors ${
                            canGoNext 
                              ? 'hover:bg-gray-200 text-gray-700' 
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Day names header - Monday first */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {dayNames.map((d, idx) => (
                          <div 
                            key={d} 
                            className={`py-2 text-center text-xs sm:text-sm font-semibold ${
                              idx === 6 ? 'text-red-400' : 'text-gray-600'
                            }`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar grid */}
                      {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7 gap-1 sm:gap-2">
                          {week.map((date, dayIdx) => {
                            // Empty cell for days before month starts
                            if (!date) {
                              return <div key={`empty-${weekIdx}-${dayIdx}`} className="aspect-square" />;
                            }
                            
                            const isPast = date < today;
                            const isFuture = date > maxDate;
                            const dateStr = formatDateValue(date);
                            const isSelected = selectedDate === dateStr;
                            const isToday = date.toDateString() === today.toDateString();
                            const isSunday = date.getDay() === 0;
                            const availability = isDateAvailable(date);
                            
                            // CRITICAL: Check if date has available slots
                            // For today, we need to be extra careful - only enable if explicitly in the set
                            const hasSlots = datesWithSlots.has(dateStr);
                            
                            // Check capacity - disable if 100% full (red)
                            const isoDateStr = formatDateToISO(date);
                            const capacity = capacityData.get(isoDateStr);
                            const isFull = capacity && capacity.percentage >= 100;
                            
                            // CRITICAL: Determine if date should be disabled
                            // 1. Past dates are always disabled
                            // 2. Future dates beyond 3 months are disabled
                            // 3. Non-working days are disabled
                            // 4. Days without available slots are disabled
                            // 5. Full days (100% capacity) are disabled
                            // 6. TODAY: Only enable if loading is COMPLETE AND it's in the datesWithSlots set
                            let isDisabled = isPast || isFuture || !availability.available || isFull;
                            
                            // For all dates (including today): disable if no slots available
                            // But only after loading is complete to avoid flickering
                            if (!loadingDates && hasReliableDatesData && !hasSlots) {
                              isDisabled = true;
                            }
                            
                            // During loading, disable dates that are not yet confirmed to have slots
                            // This prevents clicking on dates before we know if they have slots
                            if (loadingDates && !hasSlots) {
                              isDisabled = true;
                            }
                            
                            return (
                              <button
                                key={`${weekIdx}-${dayIdx}`}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  if (!isDisabled) {
                                    setSelectedDate(dateStr);
                                    setSelectedTime('');
                                    setTimeout(() => {
                                      const timeSection = document.getElementById('guest-booking-time-section');
                                      if (timeSection) {
                                        timeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }
                                    }, 120);
                                  }
                                }}
                                title={
                                  isDisabled 
                                    ? isFull
                                      ? 'Dan je potpuno popunjen'
                                      : !hasSlots && !isPast && !isFuture && availability.available
                                        ? isToday 
                                          ? 'Nema dostupnih termina za danas'
                                          : 'Nema dostupnih termina'
                                        : availability.reason || 'Nedostupno'
                                    : undefined
                                }
                                className={`
                                  aspect-square flex flex-col items-center justify-center rounded-xl 
                                  text-sm sm:text-base font-medium transition-all duration-200
                                  ${isDisabled
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-200'
                                    : isSelected 
                                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg scale-105' 
                                      : isSunday
                                        ? 'bg-red-50 text-red-400 hover:bg-red-100 border border-red-100'
                                        : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 border border-gray-200'
                                  }
                                  ${isToday && !isSelected && !isDisabled ? 'ring-2 ring-orange-400 ring-offset-1' : ''}
                                `}
                              >
                                <span className="text-base sm:text-xl font-bold">
                                  {date.getDate()}
                                </span>
                                {isDisabled && !isPast && !isFuture && (
                                  <span className="hidden sm:block text-[11px] leading-tight">
                                    {!hasSlots && availability.available 
                                      ? 'Nema termina'
                                      : isFull
                                        ? 'Popunjeno'
                                        : availability.reason || 'Zatvoreno'
                                    }
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                      
                      {/* Selected date display */}
                      {selectedDate && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl text-center border border-orange-200">
                          <span className="text-orange-700 font-medium text-base">
                            Odabrani datum: <strong className="text-orange-800">{selectedDate}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <p className="text-sm text-gray-500 text-center">
                Možete rezervisati termin do 3 mjeseca unaprijed
              </p>

              {selectedDate && (
                <div id="guest-booking-time-section" className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-orange-500" />
                    <h4 className="text-base font-semibold text-gray-900">Dostupna vremena za {selectedDate}</h4>
                  </div>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-gray-600">Učitavanje dostupnih termina...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                      <ClockIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-base font-medium text-gray-900 mb-1">Nema dostupnih termina</h3>
                      <p className="text-sm text-gray-600">Za izabrani datum nema slobodnih termina. Pokušajte drugi datum.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500">Datum: <strong>{selectedDate}</strong></span>
                        <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                          {availableSlots.length} dostupnih
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => {
                              setSelectedTime(slot);
                              setTimeout(() => {
                                const notesElement = document.getElementById('guest-booking-notes');
                                if (notesElement) {
                                  notesElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }, 180);
                            }}
                            className={`relative flex items-center justify-center py-3 px-2 rounded-xl border-2 transition-all ${
                              selectedTime === slot
                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                : 'border-green-200 bg-green-50 hover:border-green-300'
                            }`}
                          >
                            <span className={`text-sm sm:text-base font-semibold ${selectedTime === slot ? 'text-orange-700' : 'text-green-700'}`}>
                              {slot}
                            </span>
                            {selectedTime === slot && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-1" id="guest-booking-notes">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Napomena (opciono)
                      {selectedTime && (
                        <span className="ml-2 text-xs text-green-600">✓ Vrijeme odabrano</span>
                      )}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Dodatne napomene za frizera..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Step 4: Guest Info (Guest Only) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold">Vaši podaci</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Unesite vaše podatke kako bi vas salon mogao kontaktirati.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ime i prezime *</label>
                <input
                  type="text"
                  value={guestData.guest_name}
                  onChange={(e) => {
                    setGuestData({ ...guestData, guest_name: e.target.value });
                    if (validationErrors.guest_name) {
                      setValidationErrors({ ...validationErrors, guest_name: undefined });
                    }
                  }}
                  placeholder="Vaše ime i prezime"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.guest_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.guest_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {validationErrors.guest_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Broj telefona *</label>
                <input
                  type="tel"
                  value={guestData.guest_phone}
                  onChange={(e) => {
                    setGuestData({ ...guestData, guest_phone: e.target.value });
                    if (validationErrors.guest_phone) {
                      setValidationErrors({ ...validationErrors, guest_phone: undefined });
                    }
                  }}
                  placeholder="+387 6X XXX XXX"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.guest_phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.guest_phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {validationErrors.guest_phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresa (opciono)</label>
                <input
                  type="text"
                  value={guestData.guest_address}
                  onChange={(e) => {
                    setGuestData({ ...guestData, guest_address: e.target.value });
                    if (validationErrors.guest_address) {
                      setValidationErrors({ ...validationErrors, guest_address: undefined });
                    }
                  }}
                  placeholder="Vaša adresa stanovanja"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.guest_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.guest_address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {validationErrors.guest_address}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (opciono)</label>
                <input
                  type="email"
                  value={guestData.guest_email}
                  onChange={(e) => {
                    setGuestData({ ...guestData, guest_email: e.target.value });
                    if (validationErrors.guest_email) {
                      setValidationErrors({ ...validationErrors, guest_email: undefined });
                    }
                  }}
                  placeholder="vas@email.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                    validationErrors.guest_email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.guest_email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    {validationErrors.guest_email}
                  </p>
                )}
              </div>

              {/* Booking Summary */}
              <div className="bg-orange-50 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Pregled rezervacije:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Salon:</strong> {salon.name}</p>
                  {selectedServices.map((item, idx) => (
                    <p key={idx}><strong>Usluga:</strong> {item.service?.name}</p>
                  ))}
                  <p><strong>Datum:</strong> {selectedDate}</p>
                  <p><strong>Vrijeme:</strong> {selectedTime}</p>
                  <p><strong>Cijena:</strong> <span className="text-orange-600 font-semibold">{getTotalPrice()} KM</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg mt-4">
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {step >= 1 && step <= (user ? 3 : 4) && (
          <div
            className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-t bg-gray-50"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
          >
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Nazad
            </button>
            
            <button
              onClick={() => {
                // CRITICAL: Direct validation before proceeding
                if (step === 1) {
                  const totalDur = selectedServices.reduce((t, s) => t + (Number(s.service?.duration) || 0), 0);
                  if (totalDur === 0) {
                    setError('Ne možete rezervisati ovu uslugu samostalno. Molimo dodajte glavnu uslugu.');
                    return;
                  }
                }
                handleNext();
              }}
              disabled={loading || !canProceed() || (step === 1 && isZeroDurationOnly)}
              className={`${
                (step === 1 && isZeroDurationOnly) 
                  ? 'bg-gray-300 cursor-not-allowed opacity-60' 
                  : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300'
              } disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors`}
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {step === 3 && user ? 'Potvrdi rezervaciju' : step === (user ? 3 : 4) ? 'Potvrdi rezervaciju' : 'Nastavi'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestBookingModal;

