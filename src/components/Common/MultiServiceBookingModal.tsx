import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { appointmentAPI, serviceAPI, staffAPI, salonAPI } from '../../services/api';

interface MultiServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  salonId: number;
  staffId?: number;
  preselectedDate?: string;
}

interface SelectedService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export function MultiServiceBookingModal({
  isOpen,
  onClose,
  onSuccess,
  salonId,
  staffId,
  preselectedDate
}: MultiServiceBookingModalProps) {
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
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [clientData, setClientData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: ''
  });

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
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedStaff || selectedServices.length === 0 || !selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
      const response = await salonAPI.getAvailableSlots(
        String(salonId),
        selectedStaff,
        selectedDate,
        selectedServices[0].id,
        totalDuration
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
    return new Date().toISOString().split('T')[0];
  };

  const addService = (serviceId: string) => {
    const service = services.find(s => String(s.id) === serviceId);
    if (!service) return;
    
    setSelectedServices([...selectedServices, {
      id: String(service.id),
      name: service.name,
      price: service.price,
      duration: service.duration
    }]);
    setSelectedTime('');
  };

  const removeService = (index: number) => {
    const newServices = selectedServices.filter((_, i) => i !== index);
    
    // Check if remaining services have total duration > 0
    const remainingDuration = newServices.reduce((sum, s) => sum + Number(s.duration), 0);
    
    // If only 0-duration services remain, show warning
    if (newServices.length > 0 && remainingDuration === 0) {
      setError('Ne možete rezervisati samo dodatne usluge. Molimo dodajte glavnu uslugu.');
    } else {
      setError(null);
    }
    
    setSelectedServices(newServices);
    setSelectedTime('');
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, s) => sum + Number(s.duration), 0);
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
    
    // VALIDATION: Check for zero duration services
    const totalDuration = getTotalDuration();
    if (totalDuration === 0) {
      setError('Ne možete rezervisati ovu uslugu samostalno. Molimo dodajte glavnu uslugu.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create appointment with all services
      const serviceIds = selectedServices.map(s => s.id);
      
      // Prepare appointment data
      const appointmentData: any = {
        salon_id: salonId,
        staff_id: Number(selectedStaff),
        date: selectedDate,
        time: selectedTime,
        notes,
        ...clientData,
        is_manual: true
      };
      
      // Send service_id for single service, services array for multiple
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
    setServiceSearch('');
    setExpandedCategories(new Set());
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

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const availableStaff = selectedServices.length > 0
    ? staff.filter(s => 
        selectedServices.every(svc => 
          s.services?.some((staffSvc: any) => String(staffSvc.id) === svc.id) || 
          s.service_ids?.includes(Number(svc.id))
        )
      )
    : staff;

  const availableServicesToAdd = services.filter(s => {
    const notSelected = !selectedServices.some(ss => ss.id === String(s.id));
    const matchesSearch = serviceSearch === '' || 
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.description?.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.category?.toLowerCase().includes(serviceSearch.toLowerCase());
    return notSelected && matchesSearch;
  });

  // Group services by category
  const servicesByCategory = availableServicesToAdd.reduce((acc, service) => {
    const category = service.category || 'Ostalo';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, any[]>);

  const categories = Object.keys(servicesByCategory).sort();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl mx-auto z-10 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">Ručno dodavanje termina</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zaposleni *</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datum *</label>
                <div className="relative">
                  <input
                    type="date"
                    min={getMinDate()}
                    value={convertEuropeanToISO(selectedDate)}
                    onChange={(e) => {
                      setSelectedDate(formatDateForAPI(e.target.value));
                      setSelectedTime('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {selectedDate && (
                    <div className="mt-1 text-sm text-gray-600">
                      Odabrani datum: {selectedDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Usluge *</label>
                  {selectedServices.length > 0 && (
                    <div className="text-sm font-medium text-blue-600">
                      Ukupno: {getTotalPrice()} KM | {getTotalDuration()} min
                    </div>
                  )}
                </div>

                {selectedServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg mb-2">
                    <div className="flex-1">
                      <span className="font-medium">{index + 1}. {service.name}</span>
                      <span className="text-gray-600 ml-2">- {service.price} KM ({service.duration} min)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {availableServicesToAdd.length > 0 && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Pretražite usluge..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    {availableServicesToAdd.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        {serviceSearch === '' ? (
                          // Show categories when not searching
                          categories.map(category => (
                            <div key={category} className="border-b border-gray-100 last:border-b-0">
                              <button
                                type="button"
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {expandedCategories.has(category) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                  )}
                                  <span className="font-medium text-gray-900">{category}</span>
                                  <span className="text-sm text-gray-500">({servicesByCategory[category].length})</span>
                                </div>
                              </button>
                              
                              {expandedCategories.has(category) && (
                                <div className="bg-white">
                                  {servicesByCategory[category].map((service: any) => (
                                    <button
                                      key={service.id}
                                      type="button"
                                      onClick={() => {
                                        addService(String(service.id));
                                        setServiceSearch('');
                                      }}
                                      className="w-full text-left px-4 py-3 pl-10 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="font-medium text-gray-900">{service.name}</div>
                                      <div className="text-sm text-gray-600">
                                        {service.price} KM • {service.duration} min
                                        {service.description && (
                                          <span className="ml-2 text-gray-500">• {service.description}</span>
                                        )}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          // Show flat list when searching
                          availableServicesToAdd.map(service => (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                addService(String(service.id));
                                setServiceSearch('');
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{service.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {service.price} KM • {service.duration} min
                                    {service.description && (
                                      <span className="ml-2 text-gray-500">• {service.description}</span>
                                    )}
                                  </div>
                                </div>
                                {service.category && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">
                                    {service.category}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        Nema usluga koje odgovaraju pretrazi
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedDate && selectedStaff && selectedServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vrijeme *</label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-gray-600">Učitavanje...</span>
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
                    <p className="text-gray-500 text-center py-4">Nema slobodnih termina</p>
                  )}
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Podaci o klijentu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />Ime i prezime *
                    </label>
                    <input
                      type="text"
                      value={clientData.client_name}
                      onChange={(e) => setClientData({...clientData, client_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />Telefon *
                    </label>
                    <input
                      type="tel"
                      value={clientData.client_phone}
                      onChange={(e) => setClientData({...clientData, client_phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />Email (opciono)
                    </label>
                    <input
                      type="email"
                      value={clientData.client_email}
                      onChange={(e) => setClientData({...clientData, client_email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />Adresa (opciono)
                    </label>
                    <input
                      type="text"
                      value={clientData.client_address}
                      onChange={(e) => setClientData({...clientData, client_address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Napomene (opciono)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {selectedServices.length > 0 && selectedStaff && selectedDate && selectedTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Pregled termina</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Usluge:</strong> {selectedServices.map(s => s.name).join(', ')}</p>
                    <p><strong>Zaposleni:</strong> {staff.find(s => String(s.id) === selectedStaff)?.name}</p>
                    <p><strong>Datum:</strong> {selectedDate}</p>
                    <p><strong>Vrijeme:</strong> {selectedTime}</p>
                    <p><strong>Trajanje:</strong> {getTotalDuration()} min</p>
                    <p><strong>Cijena:</strong> {getTotalPrice()} KM</p>
                  </div>
                </div>
              )}

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
                  disabled={loading || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime || !clientData.client_name || !clientData.client_phone}
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
