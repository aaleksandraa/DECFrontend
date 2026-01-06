import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, MapPin, Search } from 'lucide-react';
import { appointmentAPI, serviceAPI, staffAPI, salonAPI } from '../../services/api';

interface ManualBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salonId: number;
  staffId?: number; // If provided, pre-select this staff member
  preselectedDate?: string; // DD.MM.YYYY format
}

interface ClientData {
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address: string;
}

export function ManualBookingModal({
  isOpen,
  onClose,
  onSuccess,
  salonId,
  staffId,
  preselectedDate
}: ManualBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [selectedService, setSelectedService] = useState<string>('');
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

  // Load services and staff
  useEffect(() => {
    if (isOpen && salonId) {
      loadData();
    }
  }, [isOpen, salonId]);

  // Load available slots when service, staff, and date are selected
  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedStaff, selectedDate]);

  // Pre-select staff if provided
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
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedStaff || !selectedService || !selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const response = await salonAPI.getAvailableSlots(
        String(salonId),
        selectedStaff,
        selectedDate,
        selectedService
      );
      setAvailableSlots(response.slots || response || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatDateForAPI = (dateStr: string) => {
    // Convert YYYY-MM-DD to DD.MM.YYYY
    // Parse the string directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const convertEuropeanToISO = (europeanDate: string) => {
    // Convert DD.MM.YYYY to YYYY-MM-DD for input value
    if (!europeanDate) return '';
    const parts = europeanDate.split('.');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      setError('Molimo popunite sve podatke o terminu');
      return;
    }
    
    if (!clientData.client_name || !clientData.client_phone) {
      setError('Ime i telefon klijenta su obavezni');
      return;
    }
    
    // VALIDATION: Check for zero duration service
    const service = services.find(s => String(s.id) === selectedService);
    if (service && Number(service.duration) === 0) {
      setError('Ne možete rezervisati ovu uslugu samostalno. Molimo odaberite glavnu uslugu.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await appointmentAPI.createAppointment({
        salon_id: salonId,
        staff_id: Number(selectedStaff),
        service_id: Number(selectedService), // Single service - use service_id
        date: selectedDate,
        time: selectedTime,
        notes,
        ...clientData,
        is_manual: true // Mark as manually created
      });
      
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
    setSelectedService('');
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
    onClose();
  };

  // Filter staff based on selected service
  const availableStaff = selectedService
    ? staff.filter(s => s.services?.some((svc: any) => String(svc.id) === selectedService) || 
                       s.service_ids?.includes(Number(selectedService)))
    : staff;

  // Get selected service details
  const selectedServiceData = services.find(s => String(s.id) === selectedService);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-auto z-10 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              Ručno dodavanje termina
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Success Message */}
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

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usluga *
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    setSelectedTime('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Odaberite uslugu</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.price} KM ({service.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zaposleni *
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => {
                    setSelectedStaff(e.target.value);
                    setSelectedTime('');
                  }}
                  disabled={!!staffId}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  required
                >
                  <option value="">Odaberite zaposlenog</option>
                  {availableStaff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum * <span className="text-gray-500 font-normal">(format: DD.MM.GGGG)</span>
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="date"
                    min={getMinDate()}
                    value={convertEuropeanToISO(selectedDate)}
                    onChange={(e) => {
                      setSelectedDate(formatDateForAPI(e.target.value));
                      setSelectedTime('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {selectedDate && (
                    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      {selectedDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && selectedStaff && selectedService && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vrijeme *
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-gray-600">Učitavanje slobodnih termina...</span>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            selectedTime === slot
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Nema slobodnih termina za izabrani datum
                    </p>
                  )}
                </div>
              )}

              {/* Client Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Podaci o klijentu</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Ime i prezime *
                    </label>
                    <input
                      type="text"
                      value={clientData.client_name}
                      onChange={(e) => setClientData({...clientData, client_name: e.target.value})}
                      placeholder="Unesite ime klijenta"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      value={clientData.client_phone}
                      onChange={(e) => setClientData({...clientData, client_phone: e.target.value})}
                      placeholder="+387 6X XXX XXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email (opciono)
                    </label>
                    <input
                      type="email"
                      value={clientData.client_email}
                      onChange={(e) => setClientData({...clientData, client_email: e.target.value})}
                      placeholder="email@primjer.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Adresa (opciono)
                    </label>
                    <input
                      type="text"
                      value={clientData.client_address}
                      onChange={(e) => setClientData({...clientData, client_address: e.target.value})}
                      placeholder="Adresa klijenta"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Napomene (opciono)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Dodatne napomene za termin..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Summary */}
              {selectedService && selectedStaff && selectedDate && selectedTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Pregled termina</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Usluga:</strong> {selectedServiceData?.name}</p>
                    <p><strong>Zaposleni:</strong> {staff.find(s => String(s.id) === selectedStaff)?.name}</p>
                    <p><strong>Datum:</strong> {selectedDate}</p>
                    <p><strong>Vrijeme:</strong> {selectedTime}</p>
                    <p><strong>Trajanje:</strong> {selectedServiceData?.duration} min</p>
                    <p><strong>Cijena:</strong> {selectedServiceData?.price} KM</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedService || !selectedStaff || !selectedDate || !selectedTime || !clientData.client_name || !clientData.client_phone}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
