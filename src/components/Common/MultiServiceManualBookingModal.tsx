import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { appointmentAPI, serviceAPI, staffAPI, salonAPI, publicAPI } from '../../services/api';
import { InlineCalendarPicker } from './InlineCalendarPicker';

interface MultiServiceManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salonId: number;
  staffId?: number;
  preselectedDate?: string;
}

interface ClientData {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
}

interface SelectedService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export function MultiServiceManualBookingModal({
  isOpen,
  onClose,
  onSuccess,
  salonId,
  staffId,
  preselectedDate
}: MultiServiceManualBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, 'available' | 'busy' | 'full' | 'closed'>>({});
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>(staffId ? String(staffId) : '');
  const [selectedDate, setSelectedDate] = useState<string>(preselectedDate || '');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [clientData, setClientData] = useState<ClientData>({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: ''
  });

  // Service search and filtering
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && salonId) {
      loadData();
    }
  }, [isOpen, salonId]);

  useEffect(() => {
    if (selectedServices.length > 0 && selectedStaff && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedServices, selectedStaff, selectedDate]);

  // Load month availability when staff or services change
  useEffect(() => {
    if (selectedStaff && selectedServices.length > 0) {
      loadMonthAvailability(currentCalendarMonth);
    }
  }, [selectedStaff, selectedServices, currentCalendarMonth]);

  const loadMonthAvailability = async (month?: string) => {
    if (!selectedStaff || selectedServices.length === 0) return;
    
    try {
      // Use provided month or current calendar month
      const monthStr = month || currentCalendarMonth;
      
      // Use existing availableDatesMonth endpoint
      const response = await publicAPI.getAvailableDatesForMonth(
        String(salonId),
        {
          staff_id: Number(selectedStaff),
          month: monthStr,
          services: selectedServices.map(s => ({
            serviceId: s.id,
            staffId: selectedStaff,
            duration: s.duration
          }))
        }
      );
      
      // Transform response to availability data
      const availabilityMap: Record<string, 'available' | 'busy' | 'full' | 'closed'> = {};
      
      if (response.dates && Array.isArray(response.dates)) {
        response.dates.forEach((dateInfo: any) => {
          // Backend now returns: date, available, status, available_slots, total_slots
          availabilityMap[dateInfo.date] = dateInfo.status;
        });
      }
      
      setMonthAvailability(availabilityMap);
    } catch (error) {
      console.error('Error loading month availability:', error);
      setMonthAvailability({});
    }
  };

  useEffect(() => {
    if (staffId) {
      setSelectedStaff(String(staffId));
    }
  }, [staffId]);

  const loadData = async () => {
    try {
      const [servicesData, staffData] = await Promise.all([
        serviceAPI.getServices(String(salonId)),
        staffAPI.getStaff(String(salonId))
      ]);
      
      setServices(Array.isArray(servicesData) ? servicesData : (servicesData?.data || []));
      setStaff(Array.isArray(staffData) ? staffData : (staffData?.data || []));
      
      // Categories closed by default
      setExpandedCategories(new Set());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };


  const loadAvailableSlots = async () => {
    if (!selectedStaff || selectedServices.length === 0 || !selectedDate) return;
    
    setLoadingSlots(true);
    try {
      // Calculate total duration of all selected services
      const totalDuration = getTotalDuration();
      
      // Format date for API (DD.MM.YYYY)
      const formattedDate = formatDateForAPI(selectedDate);
      
      // If multiple services or need to check total duration, use multi-service endpoint
      if (selectedServices.length > 1 || totalDuration > 0) {
        // Use multi-service endpoint that considers total duration
        const services = selectedServices.map(service => ({
          serviceId: service.id,
          staffId: selectedStaff,
          duration: service.duration
        }));
        
        const response = await salonAPI.getAvailableSlotsForMultipleServices(
          String(salonId),
          formattedDate,
          services
        );
        setAvailableSlots(response.slots || response || []);
      } else {
        // Single service - use simple endpoint
        const response = await salonAPI.getAvailableSlots(
          String(salonId),
          selectedStaff,
          formattedDate,
          selectedServices[0].id
        );
        setAvailableSlots(response.slots || response || []);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDateForAPI = (dateStr: string) => {
    if (!dateStr) return '';
    
    // If already in DD.MM.YYYY format, return as is
    if (dateStr.includes('.')) {
      return dateStr;
    }
    
    // If in YYYY-MM-DD format (ISO), convert to DD.MM.YYYY
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}.${month}.${year}`;
      }
    }
    
    // Fallback: return as is
    return dateStr;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleAddService = (serviceId: string) => {
    const service = services.find(s => String(s.id) === serviceId);
    if (!service) return;
    
    if (selectedServices.some(s => s.id === serviceId)) {
      setError('Ova usluga je već dodana');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setSelectedServices([...selectedServices, {
      id: String(service.id),
      name: service.name,
      duration: service.duration,
      price: service.price
    }]);
    setSelectedTime('');
  };


  const handleRemoveService = (serviceId: string) => {
    const newServices = selectedServices.filter(s => s.id !== serviceId);
    const remainingDuration = newServices.reduce((sum, s) => sum + Number(s.duration), 0);
    
    if (newServices.length > 0 && remainingDuration === 0) {
      setError('Ne možete rezervisati samo dodatne usluge. Molimo dodajte glavnu uslugu.');
    } else {
      setError(null);
    }
    
    setSelectedServices(newServices);
    setSelectedTime('');
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, s) => sum + Number(s.duration), 0);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime) {
      setError('Molimo popunite sve podatke o terminu');
      return;
    }
    
    if (!clientData.client_name || !clientData.client_phone) {
      setError('Ime i telefon klijenta su obavezni');
      return;
    }
    
    const totalDuration = getTotalDuration();
    if (totalDuration === 0) {
      setError('Ne možete rezervisati ovu uslugu samostalno. Molimo dodajte glavnu uslugu.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const serviceIds = selectedServices.map(s => s.id);
      const appointmentData: any = {
        salon_id: salonId,
        staff_id: Number(selectedStaff),
        date: selectedDate,
        time: selectedTime,
        notes: notes,
        total_price: getTotalPrice(),
        ...clientData,
        is_manual: true
      };
      
      if (serviceIds.length === 1) {
        appointmentData.service_id = Number(serviceIds[0]);
      } else {
        appointmentData.services = serviceIds.map(id => ({ id: Number(id) }));
      }
      
      await appointmentAPI.createAppointment(appointmentData);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Greška pri kreiranju termina');
    } finally {
      setLoading(false);
    }
  };


  const handleClose = () => {
    setSelectedServices([]);
    setSelectedStaff(staffId ? String(staffId) : '');
    setSelectedDate(preselectedDate || '');
    setSelectedTime('');
    setNotes('');
    setClientData({
      client_name: '',
      client_email: '',
      client_phone: '',
      client_address: ''
    });
    setError(null);
    setSuccess(false);
    setAvailableSlots([]);
    setServiceSearch('');
    setExpandedCategories(new Set());
    setMonthAvailability({});
    // Reset calendar to current month
    const today = new Date();
    setCurrentCalendarMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    onClose();
  };

  // Group services by category
  const groupedServices = services.reduce((acc: any, service: any) => {
    const category = service.category || 'Ostalo';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {});

  // Filter services based on search
  const filteredGroupedServices = Object.entries(groupedServices).reduce((acc: any, [category, categoryServices]: [string, any]) => {
    const filtered = categoryServices.filter((service: any) =>
      service.name.toLowerCase().includes(serviceSearch.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter staff based on selected services
  const availableStaff = selectedServices.length > 0
    ? staff.filter(s => 
        selectedServices.every(service => 
          s.services?.some((svc: any) => String(svc.id) === service.id) || 
          s.service_ids?.includes(Number(service.id))
        )
      )
    : staff;

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-7xl mx-auto z-10 max-h-[95vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-xl font-semibold text-white">
              Ručno dodavanje termina
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {success && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Termin uspješno kreiran!</h3>
              <p className="text-gray-600">Termin je dodan u raspored.</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
              {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto max-h-[calc(95vh-160px)] lg:overflow-visible">

                
                {/* LEFT COLUMN - Staff, Date/Time, Client, Notes */}
                <div className="space-y-4 lg:overflow-y-auto lg:max-h-[calc(95vh-200px)]">
                  
                  {/* Staff Selection - Mobile: 1st, Desktop: 1st */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Zaposleni
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {availableStaff.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStaff(String(s.id));
                            setSelectedTime('');
                          }}
                          disabled={!!staffId}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            selectedStaff === String(s.id)
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300 bg-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="font-medium text-gray-900 text-sm lg:text-base">{s.name}</div>
                          {s.specialization && (
                            <div className="text-xs lg:text-sm text-gray-600 mt-0.5">{s.specialization}</div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {selectedServices.length > 0 && availableStaff.length === 0 && (
                      <p className="text-xs lg:text-sm text-amber-600 mt-2">
                        Nema zaposlenih koji nude sve odabrane usluge
                      </p>
                    )}
                  </div>

                  {/* Service Selection - Mobile Only (2nd position) */}
                  <div className="lg:hidden bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Search className="w-5 h-5 text-blue-600" />
                      Odabir usluga
                    </h3>
                    
                    {/* Search */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          placeholder="Pretraži usluge..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Services by Category */}
                    <div className="space-y-2 max-h-[1200px] overflow-y-auto">
                      {Object.keys(filteredGroupedServices).length > 0 ? (
                        Object.entries(filteredGroupedServices).map(([category, categoryServices]: [string, any]) => (
                          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="font-medium text-gray-900 text-sm">{category}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">({categoryServices.length})</span>
                                {expandedCategories.has(category) ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                                )}
                              </div>
                            </button>
                            
                            {expandedCategories.has(category) && (
                              <div className="p-1.5 space-y-1">
                                {categoryServices.map((service: any) => {
                                  const isSelected = selectedServices.some(s => s.id === String(service.id));
                                  return (
                                    <button
                                      key={service.id}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          handleRemoveService(String(service.id));
                                        } else {
                                          handleAddService(String(service.id));
                                        }
                                      }}
                                      className={`w-full text-left p-3 rounded-lg transition-all ${
                                        isSelected
                                          ? 'bg-blue-50 border-2 border-blue-600'
                                          : 'bg-white border border-gray-200 hover:border-blue-300'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-900 text-base">{service.name}</div>
                                          <div className="text-sm text-gray-600 mt-1">
                                            {service.duration} min • {service.price} KM
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <div className="ml-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          {serviceSearch ? (
                            <>
                              <p className="mb-2">Nema usluga koje odgovaraju pretrazi</p>
                              <button
                                type="button"
                                onClick={() => setServiceSearch('')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Obriši pretragu
                              </button>
                            </>
                          ) : (
                            <p>Nema dostupnih usluga</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Services Summary - Mobile */}
                    {selectedServices.length > 0 && (
                      <div className="mt-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                          Odabrane usluge ({selectedServices.length})
                        </h3>
                        
                        <div className="space-y-2 mb-3">
                          {selectedServices.map((service, index) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-lg shadow-sm"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">
                                  {index + 1}. {service.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {service.duration} min • {service.price} KM
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveService(service.id)}
                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-3 border-t border-blue-200 space-y-2">
                          <div className="flex justify-between text-sm font-semibold text-gray-900">
                            <span>Ukupno trajanje:</span>
                            <span className="text-blue-600">{getTotalDuration()} min</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold text-gray-900">
                            <span>Ukupna cijena:</span>
                            <span className="text-purple-600">{getTotalPrice()} KM</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date & Time Selection */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      Datum i vrijeme
                    </h3>
                    
                    {selectedStaff && selectedServices.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[500px]">
                        {/* Calendar - Left on Desktop, Top on Mobile */}
                        <div className="lg:h-full">
                          <InlineCalendarPicker
                            selectedDate={selectedDate}
                            onDateSelect={(date) => {
                              setSelectedDate(date);
                              setSelectedTime('');
                            }}
                            salonId={salonId}
                            staffId={selectedStaff}
                            minDate={formatDateForAPI(getMinDate())}
                            availabilityData={monthAvailability}
                            onMonthChange={(month) => {
                              setCurrentCalendarMonth(month);
                              loadMonthAvailability(month);
                            }}
                          />
                        </div>
                        
                        {/* Time Slots - Right on Desktop, Bottom on Mobile */}
                        {selectedDate && (
                          <div className="flex flex-col lg:h-full">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              Dostupni termini za {selectedDate}
                            </h4>
                            
                            {loadingSlots ? (
                              <div className="flex-1 flex items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-center">
                                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                  <span className="text-gray-600 text-sm">Učitavanje termina...</span>
                                </div>
                              </div>
                            ) : availableSlots.length > 0 ? (
                              <div className="flex-1 overflow-y-auto">
                                <div className="grid grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 pb-2">
                                  {availableSlots.map(slot => (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => setSelectedTime(slot)}
                                      className={`py-3 px-2 rounded-lg text-sm lg:text-base font-medium transition-all ${
                                        selectedTime === slot
                                          ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400 scale-105'
                                          : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300'
                                      }`}
                                    >
                                      {slot}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <div className="text-center">
                                  <div className="text-4xl mb-2">📅</div>
                                  <p className="text-gray-500 text-sm font-medium">Nema slobodnih termina</p>
                                  <p className="text-gray-400 text-xs mt-1">Odaberite drugi datum</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-4xl mb-3">👆</div>
                        <p className="text-gray-600 text-sm font-medium mb-1">Odaberite zaposlenog i usluge</p>
                        <p className="text-gray-400 text-xs">da vidite dostupne termine</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Client Information - Mobile: 4th, Desktop: 3rd */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Podaci o klijentu
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Desktop: Ime i Telefon u jednom redu */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={clientData.client_name}
                          onChange={(e) => setClientData({...clientData, client_name: e.target.value})}
                          placeholder="Ime i prezime *"
                          className="w-full px-3 py-2.5 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        
                        <input
                          type="tel"
                          value={clientData.client_phone}
                          onChange={(e) => setClientData({...clientData, client_phone: e.target.value})}
                          placeholder="Telefon *"
                          className="w-full px-3 py-2.5 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      
                      {/* Email u drugom redu */}
                      <input
                        type="email"
                        value={clientData.client_email}
                        onChange={(e) => setClientData({...clientData, client_email: e.target.value})}
                        placeholder="Email (opciono)"
                        className="w-full px-3 py-2.5 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Notes - Mobile: 5th, Desktop: 4th */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3">Napomene</h3>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Dodatne napomene za termin..."
                      className="w-full px-3 py-2.5 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN - Services (Desktop only) */}
                {/* Mobile: Services shown in left column after Staff */}
                <div className="hidden lg:block space-y-4 lg:overflow-y-auto lg:max-h-[calc(95vh-200px)]">
                  
                  {/* Service Selection - Desktop */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Search className="w-5 h-5 text-blue-600" />
                      Odabir usluga
                    </h3>
                    
                    {/* Search */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          placeholder="Pretraži usluge..."
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Services by Category */}
                    <div className="space-y-2 max-h-[1200px] overflow-y-auto">
                      {Object.keys(filteredGroupedServices).length > 0 ? (
                        Object.entries(filteredGroupedServices).map(([category, categoryServices]: [string, any]) => (
                          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="font-medium text-gray-900 text-sm">{category}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">({categoryServices.length})</span>
                                {expandedCategories.has(category) ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                                )}
                              </div>
                            </button>
                            
                            {expandedCategories.has(category) && (
                              <div className="p-1.5 space-y-1">
                                {categoryServices.map((service: any) => {
                                  const isSelected = selectedServices.some(s => s.id === String(service.id));
                                  return (
                                    <button
                                      key={service.id}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          handleRemoveService(String(service.id));
                                        } else {
                                          handleAddService(String(service.id));
                                        }
                                      }}
                                      className={`w-full text-left p-3 rounded-lg transition-all ${
                                        isSelected
                                          ? 'bg-blue-50 border-2 border-blue-600'
                                          : 'bg-white border border-gray-200 hover:border-blue-300'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-900">{service.name}</div>
                                          <div className="text-sm text-gray-600 mt-1">
                                            {service.duration} min • {service.price} KM
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <div className="ml-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          {serviceSearch ? (
                            <>
                              <p className="mb-2">Nema usluga koje odgovaraju pretrazi</p>
                              <button
                                type="button"
                                onClick={() => setServiceSearch('')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Obriši pretragu
                              </button>
                            </>
                          ) : (
                            <p>Nema dostupnih usluga</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Selected Services Summary */}
                  {selectedServices.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Odabrane usluge ({selectedServices.length})
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        {selectedServices.map((service, index) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {index + 1}. {service.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {service.duration} min • {service.price} KM
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(service.id)}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 border-t border-blue-200 space-y-2">
                        <div className="flex justify-between text-base font-semibold text-gray-900">
                          <span>Ukupno trajanje:</span>
                          <span className="text-blue-600">{getTotalDuration()} min</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold text-gray-900">
                          <span>Ukupna cijena:</span>
                          <span className="text-purple-600">{getTotalPrice()} KM</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Preview */}
                  {selectedServices.length > 0 && selectedStaff && selectedDate && selectedTime && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Pregled termina
                      </h4>
                      <div className="text-sm text-green-800 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Zaposleni:</span>
                          <span className="font-medium">{staff.find(s => String(s.id) === selectedStaff)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Datum:</span>
                          <span className="font-medium">{selectedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Vrijeme:</span>
                          <span className="font-medium">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Klijent:</span>
                          <span className="font-medium">{clientData.client_name || '-'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 px-6 py-4 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime || !clientData.client_name || !clientData.client_phone}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Kreiranje...' : 'Kreiraj termin'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
