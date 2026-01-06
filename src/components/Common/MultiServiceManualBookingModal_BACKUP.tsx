import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Phone, Mail, MapPin, Plus, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { appointmentAPI, serviceAPI, staffAPI, salonAPI } from '../../services/api';

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
      
      // Auto-expand all categories on load
      const allServices = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
      const categories = new Set(allServices.map((s: any) => s.category || 'Ostalo'));
      setExpandedCategories(categories);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };


  const loadAvailableSlots = async () => {
    if (!selectedStaff || selectedServices.length === 0 || !selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const response = await salonAPI.getAvailableSlots(
        String(salonId),
        selectedStaff,
        selectedDate,
        selectedServices[0].id
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
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const convertEuropeanToISO = (europeanDate: string) => {
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(95vh-180px)]">

                
                {/* LEFT COLUMN - Client & Appointment Details */}
                <div className="space-y-6">
                  
                  {/* Client Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Podaci o klijentu
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
