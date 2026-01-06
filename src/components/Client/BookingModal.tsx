import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, User, CreditCard, CheckCircle, Plus, Trash2, Check } from 'lucide-react';
import { Salon, Service, Staff, StaffRole, StaffRoleLabels } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TimeSlotPicker } from './TimeSlotPicker';
import { ReviewModal } from './ReviewModal';
import { EuropeanDatePicker } from './EuropeanDatePicker';
import { serviceAPI, staffAPI, appointmentAPI } from '../../services/api';
import { useFormStore } from '../../store/formStore';
import { AutoSaveIndicator } from '../Common/AutoSaveIndicator';
import { useAutoSave } from '../../hooks/useAutoSave';
import SuccessModal from '../Common/SuccessModal';
import { ServiceSelector } from '../Common/ServiceSelector';

interface BookingModalProps {
  salon: Salon;
  selectedService?: Service | null;
  onClose: () => void;
  onBookingComplete?: () => void;
}

export function BookingModal({ salon, selectedService, onClose, onBookingComplete: _onBookingComplete }: BookingModalProps) {
  const { user } = useAuth();
  const { appointmentForm, setAppointmentForm, clearAppointmentForm } = useFormStore();
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any[]>([]);
  const [createdAppointment, setCreatedAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const bookingData = {
    date: appointmentForm.date || '',
    time: appointmentForm.time || '',
    notes: appointmentForm.notes || ''
  };
  
  const updateBookingData = (updates: Partial<typeof bookingData>) => {
    setAppointmentForm({ ...updates });
  };

  // Get selected services as full objects
  const getSelectedServices = (): Service[] => {
    return selectedServiceIds
      .map(id => services.find(s => s.id === id))
      .filter((s): s is Service => s !== undefined);
  };

  // Get staff who can perform ALL selected services
  const getAvailableStaffForAllServices = (): Staff[] => {
    const selectedServicesData = getSelectedServices();
    if (selectedServicesData.length === 0) return staff;
    
    return staff.filter(staffMember => 
      selectedServicesData.every(service => 
        service.staff_ids?.includes(staffMember.id)
      )
    );
  };

  const getTotalDuration = (): number => {
    return getSelectedServices().reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  };

  const getTotalPrice = (): number => {
    return getSelectedServices().reduce((sum, s) => sum + (s.discount_price || s.price || 0), 0);
  };

  useEffect(() => {
    loadSalonData();
  }, [salon.id]);

  useEffect(() => {
    if (selectedService && selectedServiceIds.length === 0) {
      setSelectedServiceIds([selectedService.id]);
    }
  }, [selectedService]);

  // Auto-select staff if only one available (but don't skip the step)
  useEffect(() => {
    const availableStaff = getAvailableStaffForAllServices();
    if (availableStaff.length === 1 && !selectedStaffId) {
      setSelectedStaffId(availableStaff[0].id);
    }
  }, [selectedServiceIds, staff]);

  const loadSalonData = async () => {
    try {
      setLoading(true);
      const servicesData = await serviceAPI.getServices(salon.id);
      setServices(Array.isArray(servicesData) ? servicesData : (servicesData?.data || []));
      
      const staffData = await staffAPI.getStaff(salon.id);
      setStaff(Array.isArray(staffData) ? staffData : (staffData?.data || []));
    } catch (error) {
      console.error('Error loading salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    setSelectedServiceIds(prev => [...prev, '']);
  };

  const removeService = (index: number) => {
    const remaining = selectedServiceIds.filter((_, i) => i !== index);
    
    // Check if remaining services have total duration > 0
    const remainingServices = remaining.map(id => services.find(s => s.id === id)).filter(Boolean) as Service[];
    const remainingDuration = remainingServices.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    
    // If only 0-duration services remain, show warning
    if (remaining.length > 0 && remainingDuration === 0) {
      setError('Ne možete rezervisati samo dodatne usluge. Molimo dodajte glavnu uslugu.');
    } else {
      setError(null);
    }
    
    setSelectedServiceIds(remaining);
    
    // Reset staff if they can't do remaining services
    if (remaining.length > 0 && selectedStaffId) {
      const staffCanDoAll = remainingServices.every(s => s.staff_ids?.includes(selectedStaffId));
      if (!staffCanDoAll) setSelectedStaffId('');
    }
  };

  const updateServiceAtIndex = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    
    // Prevent selecting 0-duration service as first service
    if (index === 0 && service && Number(service.duration) === 0) {
      setError('Usluge sa 0 min trajanja (dodatci) ne mogu biti prva usluga. Prvo izaberite glavnu uslugu.');
      return;
    }
    
    setError(null);
    setSelectedServiceIds(prev => prev.map((id, i) => i === index ? serviceId : id));
    // Reset staff selection when services change
    setSelectedStaffId('');
  };

  const canProceedToNextStep = (): boolean => {
    switch (step) {
      case 1: {
        const hasAllServices = selectedServiceIds.length > 0 && selectedServiceIds.every(id => id !== '');
        const totalDuration = getTotalDuration();
        return hasAllServices && totalDuration > 0; // Must have services AND total duration > 0
      }
      case 2: return !!selectedStaffId;
      case 3: return !!bookingData.date;
      case 4: return !!bookingData.time;
      default: return false;
    }
  };

  const handleAutoSave = useCallback(() => {
    setAutoSaveStatus('saving');
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }, 300);
  }, []);

  useAutoSave(handleAutoSave, bookingData, 800);

  const handleSubmit = async () => {
    if (!user || !canProceedToNextStep()) return;

    try {
      setLoading(true);
      
      // Create ONE appointment with all services
      const serviceIds = selectedServiceIds.filter(id => id !== '');
      
      // Prepare appointment data
      const appointmentData: any = {
        salon_id: salon.id,
        staff_id: selectedStaffId,
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes
      };
      
      // Send service_id for single service, services array for multiple
      if (serviceIds.length === 1) {
        appointmentData.service_id = Number(serviceIds[0]);
      } else {
        appointmentData.services = serviceIds.map(id => ({ id: Number(id) }));
      }
      
      const response = await appointmentAPI.createAppointment(appointmentData);
      
      const appointment = response.appointment;
      setBookingDetails([appointment]);
      setCreatedAppointment(appointment);
      setShowSuccess(true);
      clearAppointmentForm();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Došlo je do greške pri rezervaciji termina.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Izaberite usluge', 'Izaberite frizera', 'Izaberite datum', 'Izaberite vrijeme'];

  // Build selectedServices array for TimeSlotPicker
  const selectedServicesForPicker = getSelectedServices().map(service => ({
    id: service.id,
    service: {
      id: service.id,
      name: service.name,
      duration: service.duration,
      price: service.price,
      discount_price: service.discount_price
    },
    staffId: selectedStaffId
  }));

  if (showSuccess && createdAppointment) {
    return (
      <>
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            setCreatedAppointment(null);
            onClose();
          }}
          appointment={createdAppointment}
        />
        {showReviewModal && bookingDetails.length > 0 && (
          <ReviewModal
            salon={salon}
            appointmentId={bookingDetails[0].id}
            staffId={bookingDetails[0].staff_id}
            serviceId={bookingDetails[0].service_id}
            onClose={() => setShowReviewModal(false)}
            onReviewSubmitted={() => { setShowReviewModal(false); setShowSuccess(false); onClose(); }}
          />
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Rezervacija termina</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
          
          <div className="flex items-center">
            {[1, 2, 3, 4].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  step >= stepNum ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : stepNum}
                </div>
                {stepNum < 4 && <div className={`flex-1 h-1 mx-1 sm:mx-2 ${step > stepNum ? 'bg-orange-500' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">{stepTitles[step - 1]}</p>
        </div>

        <div className="p-4 sm:p-6">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Izaberite usluge</h3>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedServiceIds.map((serviceId, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <ServiceSelector
                          services={services}
                          selectedServiceId={serviceId}
                          onSelect={(id) => updateServiceAtIndex(index, id)}
                          label="Pretražite ili odaberite uslugu"
                          excludeZeroDuration={index === 0}
                        />
                      </div>
                      {selectedServiceIds.length > 1 && (
                        <button onClick={() => removeService(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={addService}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-orange-300 rounded-xl hover:bg-orange-50"
                  >
                    <Plus className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-500 font-medium">Dodaj uslugu</span>
                  </button>
                  
                  {selectedServiceIds.every(id => id) && selectedServiceIds.length > 0 && (
                    <div className={`rounded-xl p-4 ${
                      getTotalDuration() === 0 
                        ? 'bg-red-50 border-2 border-red-300' 
                        : 'bg-orange-50 border border-orange-200'
                    }`}>
                      {getTotalDuration() === 0 ? (
                        <p className="text-sm text-red-700">
                          Ne možete rezervisati ovu uslugu samostalno. Molimo dodajte glavnu uslugu.
                        </p>
                      ) : (
                        <p className="text-sm text-orange-700">
                          <strong>Ukupno:</strong> {selectedServiceIds.length} usluga, {getTotalDuration()} min, {getTotalPrice()} KM
                        </p>
                      )}
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedToNextStep()}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
              >
                Nastavi
              </button>
            </div>
          )}

          {/* Step 2: Staff Selection - ONE staff for ALL services */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Izaberite frizera</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Izaberite frizera koji će obaviti sve vaše usluge ({getTotalDuration()} min ukupno)
              </p>
              
              {(() => {
                const availableStaff = getAvailableStaffForAllServices();
                
                if (availableStaff.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">Nema frizera koji može obaviti sve izabrane usluge.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {availableStaff.map(member => (
                      <div
                        key={member.id}
                        onClick={() => setSelectedStaffId(member.id)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedStaffId === member.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <p className="text-sm text-gray-600">{StaffRoleLabels[member.role as StaffRole] || member.role}</p>
                            {member.review_count > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-yellow-600">★ {member.rating}</span>
                                <span className="text-xs text-gray-500">({member.review_count} recenzija)</span>
                              </div>
                            )}
                          </div>
                          {selectedStaffId === member.id && <Check className="w-5 h-5 text-orange-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium">
                  Nazad
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedToNextStep()}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  Nastavi
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Date Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Izaberite datum</h3>
              </div>
              
              <EuropeanDatePicker
                value={bookingData.date}
                onChange={(date) => updateBookingData({ date, time: '' })}
                minDate={new Date()}
                maxDate={new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0)}
                placeholder="Izaberite datum"
              />
              
              <div className="h-48"></div>
              
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium">
                  Nazad
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!canProceedToNextStep()}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  Nastavi
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Time Selection */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Izaberite vrijeme</h3>
              </div>
              
              {bookingData.date && selectedServicesForPicker.length > 0 && (
                <TimeSlotPicker
                  salonId={salon.id}
                  staffId={selectedStaffId}
                  serviceDuration={getTotalDuration()}
                  selectedDate={bookingData.date}
                  selectedServices={selectedServicesForPicker}
                  onTimeSelect={(time) => updateBookingData({ time })}
                  selectedTime={bookingData.time}
                />
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Napomene (opcionalno)</label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => updateBookingData({ notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Dodatne napomene..."
                />
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium">
                  Nazad
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canProceedToNextStep() || loading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  {loading ? 'Obrađuje se...' : 'Potvrdi rezervaciju'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
