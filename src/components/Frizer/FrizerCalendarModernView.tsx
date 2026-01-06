import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import axios from 'axios';
import { format, addDays, isSameDay, parseISO, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { sr } from 'date-fns/locale';
import { MultiServiceManualBookingModal } from '../Common/MultiServiceManualBookingModal';

interface Appointment {
  id: number;
  start_time: string;
  end_time: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  service_name: string;
  staff_name: string;
  staff_id: number;
  status: string;
  notes?: string;
  services?: Array<{
    name: string;
    duration: number;
    price: number;
  }>;
}

interface DayAvailability {
  date: string;
  available_slots: number;
  total_slots: number;
  availability_percentage: number;
}

export default function FrizerCalendarModernView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dayAvailability, setDayAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [salonId, setSalonId] = useState<number | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const daysToShow = 14; // Show 2 weeks

  // Remove scroll on mount - first day is today
  useEffect(() => {
    const initializeData = async () => {
      const storedSalonId = localStorage.getItem('salon_id');
      const storedStaffId = localStorage.getItem('staff_id');
      if (storedSalonId) setSalonId(Number(storedSalonId));
      if (storedStaffId) setStaffId(Number(storedStaffId));
    };
    initializeData();
  }, []);

  useEffect(() => {
    // Debounce API calls to prevent rate limiting
    const timer = setTimeout(() => {
      fetchAppointments();
      fetchAvailability();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        date: format(selectedDate, 'yyyy-MM-dd'),
      };
      const response = await axios.get('/api/v1/appointments', { params });
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      // Start from today, not 7 days before
      const today = new Date();
      
      // Use single API call for the entire month instead of 14 separate calls
      const month = format(selectedDate, 'yyyy-MM');
      const response = await axios.get('/api/v1/appointments/capacity/month', {
        params: {
          month,
        },
      });

      // Backend returns 'capacity' not 'days'
      const capacityData = response.data.capacity || response.data.days || [];

      // Map the response to our format (14 days starting from today)
      const availability = [];
      for (let i = 0; i < daysToShow; i++) {
        const date = addDays(today, i);
        const dayStr = format(date, 'yyyy-MM-dd');
        const dayData = capacityData.find((d: any) => d.date === dayStr);
        
        availability.push({
          date: dayStr,
          available_slots: dayData?.free_slots || dayData?.available_slots || 0,
          total_slots: dayData?.total_slots || 0,
          availability_percentage: dayData?.total_slots > 0 
            ? ((dayData?.free_slots || dayData?.available_slots || 0) / dayData.total_slots) * 100 
            : 0,
        });
      }
      
      setDayAvailability(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 60) return 'bg-green-100 border-green-400 text-green-700';
    if (percentage >= 40) return 'bg-orange-100 border-orange-400 text-orange-700';
    return 'bg-red-100 border-red-400 text-red-700';
  };

  const getAvailabilityDot = (percentage: number) => {
    if (percentage >= 60) return 'bg-green-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(addMonths(selectedDate, 1));
  };

  const handlePrevYear = () => {
    setCurrentMonth(subYears(currentMonth, 1));
    setSelectedDate(subYears(selectedDate, 1));
  };

  const handleNextYear = () => {
    setCurrentMonth(addYears(currentMonth, 1));
    setSelectedDate(addYears(selectedDate, 1));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

  const getAppointmentsForTimeSlot = (hour: number) => {
    return appointments.filter(apt => {
      const startTime = new Date(apt.start_time);
      const startHour = startTime.getHours();
      return startHour === hour;
    });
  };

  const renderTimeline = () => {
    // Start from today, not 7 days before
    const today = new Date();
    const days = Array.from({ length: daysToShow }, (_, i) => addDays(today, i));

    return (
      <div 
        ref={timelineRef}
        className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {days.map((day, index) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const availability = dayAvailability.find(a => a.date === dayStr);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(day)}
              className={`flex-shrink-0 w-20 p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : availability && availability.total_slots > 0
                  ? getAvailabilityColor(availability.availability_percentage)
                  : 'bg-gray-50 border-gray-200'
              } hover:shadow-lg`}
            >
              <div className="text-center">
                <div className={`text-2xl font-bold ${isSelected ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                  {format(day, 'EEE', { locale: sr })}
                </div>
                {availability && availability.total_slots > 0 && (
                  <div className="flex justify-center mt-2">
                    <div className={`w-2 h-2 rounded-full ${getAvailabilityDot(availability.availability_percentage)}`} />
                  </div>
                )}
                {isToday && (
                  <div className="text-xs text-blue-600 font-semibold mt-1">Danas</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-[120px] text-center font-semibold text-lg">
            {format(currentMonth, 'MMMM', { locale: sr })}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevYear}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-[80px] text-center font-semibold text-lg">
            {format(currentMonth, 'yyyy')}
          </div>
          <button
            onClick={handleNextYear}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full md:w-auto flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium">
              {format(selectedDate, 'd. MMMM yyyy', { locale: sr })}
            </span>
          </button>
          
          {showDatePicker && (
            <div className="absolute top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => handleDateSelect(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Add Appointment Button */}
        <button
          onClick={() => setShowBookingModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Dodaj termin</span>
        </button>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />
        {renderTimeline()}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mt-4" />
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="min-w-[600px]">
            {/* Time slots */}
            {timeSlots.map((hour) => {
              const appointmentsInSlot = getAppointmentsForTimeSlot(hour);
              
              return (
                <div key={hour} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {/* Time label */}
                  <div className="w-20 flex-shrink-0 py-4 px-3 text-sm font-medium text-gray-600 border-r border-gray-200">
                    {hour}:00
                  </div>

                  {/* Appointments */}
                  <div className="flex-1 py-2 px-3">
                    {appointmentsInSlot.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {appointmentsInSlot.map((apt) => (
                          <button
                            key={apt.id}
                            onClick={() => handleAppointmentClick(apt)}
                            className="text-left p-3 rounded-lg border-l-4 bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100 hover:shadow-md transition-all"
                            style={{
                              borderLeftColor: apt.status === 'confirmed' ? '#10b981' : 
                                              apt.status === 'cancelled' ? '#ef4444' : '#3b82f6'
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-gray-900 truncate">
                                  {apt.client_name}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {apt.service_name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {format(parseISO(apt.start_time), 'HH:mm')} - {format(parseISO(apt.end_time), 'HH:mm')}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 py-2">Nema termina</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && salonId && (
        <MultiServiceManualBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            fetchAppointments();
          }}
          salonId={salonId}
          staffId={staffId || undefined}
          preselectedDate={format(selectedDate, 'yyyy-MM-dd')}
        />
      )}

      {/* Appointment Details Popup */}
      {selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAppointment(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Detalji termina</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Klijent</label>
                <div className="font-semibold text-gray-900">{selectedAppointment.client_name}</div>
              </div>

              {selectedAppointment.client_phone && (
                <div>
                  <label className="text-sm text-gray-600">Telefon</label>
                  <div className="font-medium text-gray-900">{selectedAppointment.client_phone}</div>
                </div>
              )}

              {selectedAppointment.client_email && (
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <div className="font-medium text-gray-900">{selectedAppointment.client_email}</div>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600">Usluga</label>
                <div className="font-medium text-gray-900">{selectedAppointment.service_name}</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Vrijeme</label>
                <div className="font-medium text-gray-900">
                  {format(parseISO(selectedAppointment.start_time), 'd. MMMM yyyy, HH:mm', { locale: sr })} - 
                  {format(parseISO(selectedAppointment.end_time), 'HH:mm')}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Status</label>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  selectedAppointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedAppointment.status === 'confirmed' ? 'Potvrđeno' :
                   selectedAppointment.status === 'cancelled' ? 'Otkazano' : 'Pending'}
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm text-gray-600">Napomena</label>
                  <div className="text-gray-900">{selectedAppointment.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
