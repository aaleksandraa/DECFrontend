import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  Columns,
  CalendarDays,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { serviceAPI, appointmentAPI } from '../../services/api';
import { formatDateEuropean, getCurrentDateEuropean } from '../../utils/dateUtils';
import { ClientDetailsModal } from '../Common/ClientDetailsModal';
import { MultiServiceManualBookingModal } from '../Common/MultiServiceManualBookingModal';

interface FrizerCalendarDayViewProps {
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
}

export function FrizerCalendarDayView({ onViewChange }: FrizerCalendarDayViewProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [capacityData, setCapacityData] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    loadData();
    loadCapacityData();
  }, [user, selectedMonth]); // Reload when month changes

  const loadData = async () => {
    if (!user?.staff_profile) return;

    try {
      setLoading(true);
      
      // Calculate date range for current month view
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Format dates for API (DD.MM.YYYY)
      const startDate = `${String(firstDay.getDate()).padStart(2, '0')}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${firstDay.getFullYear()}`;
      const endDate = `${String(lastDay.getDate()).padStart(2, '0')}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${lastDay.getFullYear()}`;
      
      const [appointmentsData, servicesResponse] = await Promise.all([
        appointmentAPI.getAppointments({ 
          per_page: 1000,
          start_date: startDate,
          end_date: endDate,
          staff_id: user.staff_profile.id
        }),
        serviceAPI.getServices(user.staff_profile.salon_id)
      ]);
      
      const servicesArray = Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse.data || []);
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
      
      setAppointments(appointmentsArray);
      setServices(servicesArray.filter((s: any) => s.staff_ids?.includes(user.staff_profile?.id)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCapacityData = async () => {
    if (!user?.staff_profile) return;

    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      
      const response = await appointmentAPI.getMonthCapacity(monthStr);
      
      const capacityMap = new Map();
      response.capacity.forEach((item: any) => {
        capacityMap.set(item.date, item);
      });
      
      setCapacityData(capacityMap);
    } catch (error) {
      console.error('Error loading capacity data:', error);
    }
  };

  const getWorkingHours = () => {
    if (user?.staff_profile && 'working_hours' in user.staff_profile && user.staff_profile.working_hours) {
      const hours = user.staff_profile.working_hours as any;
      let earliestStart = 24;
      let latestEnd = 0;
      
      Object.values(hours).forEach((day: any) => {
        if (day.is_working && day.start && day.end) {
          const startHour = parseInt(day.start.split(':')[0]);
          const endHour = parseInt(day.end.split(':')[0]);
          if (startHour < earliestStart) earliestStart = startHour;
          if (endHour > latestEnd) latestEnd = endHour;
        }
      });
      
      if (earliestStart < 24 && latestEnd > 0) {
        return { start: earliestStart, end: latestEnd };
      }
    }
    
    return { start: 8, end: 20 };
  };

  const workingHours = getWorkingHours();
  const workingHoursStart = workingHours.start;
  const workingHoursEnd = workingHours.end;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getDayAppointments = () => {
    const dateStr = formatDateEuropean(selectedDate);
    return appointments
      .filter(app => app.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getDayAvailability = (day: number): 'full' | 'partial' | 'free' => {
    if (!day) return 'free';
    
    const dateStr = formatDateEuropean(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day));
    const dayAppointments = appointments.filter(app => app.date === dateStr);
    
    if (dayAppointments.length === 0) return 'free';
    
    const totalWorkingMinutes = (workingHoursEnd - workingHoursStart) * 60;
    
    let bookedMinutes = 0;
    dayAppointments.forEach(app => {
      const startParts = app.time.split(':');
      const endParts = app.end_time.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      bookedMinutes += (endMinutes - startMinutes);
    });
    
    const bookedPercentage = (bookedMinutes / totalWorkingMinutes) * 100;
    
    if (bookedPercentage >= 80) return 'full';
    return 'partial';
  };

  const generateTimeSlots = () => {
    const dayAppointments = getDayAppointments();
    const slots: Array<{ type: 'appointment' | 'free'; data?: any; startTime: string; endTime: string; duration: number }> = [];
    
    let currentMinutes = workingHoursStart * 60;
    const endMinutes = workingHoursEnd * 60;
    
    const sortedAppointments = [...dayAppointments].sort((a, b) => a.time.localeCompare(b.time));
    
    sortedAppointments.forEach(appointment => {
      const appStartParts = appointment.time.split(':');
      const appStartMinutes = parseInt(appStartParts[0]) * 60 + parseInt(appStartParts[1]);
      
      const appEndParts = appointment.end_time.split(':');
      const appEndMinutes = parseInt(appEndParts[0]) * 60 + parseInt(appEndParts[1]);
      
      if (currentMinutes < appStartMinutes) {
        const freeStartHour = Math.floor(currentMinutes / 60);
        const freeStartMinute = currentMinutes % 60;
        const freeEndHour = Math.floor(appStartMinutes / 60);
        const freeEndMinute = appStartMinutes % 60;
        
        slots.push({
          type: 'free',
          startTime: `${String(freeStartHour).padStart(2, '0')}:${String(freeStartMinute).padStart(2, '0')}`,
          endTime: `${String(freeEndHour).padStart(2, '0')}:${String(freeEndMinute).padStart(2, '0')}`,
          duration: appStartMinutes - currentMinutes
        });
      }
      
      slots.push({
        type: 'appointment',
        data: appointment,
        startTime: appointment.time,
        endTime: appointment.end_time,
        duration: appEndMinutes - appStartMinutes
      });
      
      currentMinutes = appEndMinutes;
    });
    
    if (currentMinutes < endMinutes) {
      const freeStartHour = Math.floor(currentMinutes / 60);
      const freeStartMinute = currentMinutes % 60;
      const freeEndHour = Math.floor(endMinutes / 60);
      const freeEndMinute = endMinutes % 60;
      
      slots.push({
        type: 'free',
        startTime: `${String(freeStartHour).padStart(2, '0')}:${String(freeStartMinute).padStart(2, '0')}`,
        endTime: `${String(freeEndHour).padStart(2, '0')}:${String(freeEndMinute).padStart(2, '0')}`,
        duration: endMinutes - currentMinutes
      });
    }
    
    return slots;
  };

  const getAppointmentsCountForDay = (day: number) => {
    if (!day) return 0;
    const dateStr = formatDateEuropean(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day));
    return appointments.filter(app => app.date === dateStr).length;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setSelectedMonth(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'prev' ? -1 : 1));
    setSelectedDate(newDate);
    setSelectedMonth(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setSelectedMonth(today);
  };

  const selectDate = (day: number) => {
    if (!day) return;
    const newDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-400 text-green-900';
      case 'in_progress': return 'bg-blue-50 border-blue-400 text-blue-900';
      case 'confirmed': return 'bg-emerald-50 border-emerald-400 text-emerald-900';
      case 'pending': return 'bg-yellow-50 border-yellow-400 text-yellow-900';
      case 'cancelled': return 'bg-red-50 border-red-400 text-red-900';
      default: return 'bg-gray-50 border-gray-400 text-gray-900';
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Nepoznata usluga';
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const dayNames = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
  const dayAppointments = getDayAppointments();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje dnevnog rasporeda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Dostupnost</h1>
        
        <div className="flex items-center gap-3">
          {onViewChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewChange('month')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                Mjesec
              </button>
              <button
                onClick={() => onViewChange('week')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Columns className="w-4 h-4" />
                Sedmica
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white text-blue-600 shadow-sm"
              >
                <CalendarDays className="w-4 h-4" />
                Dan
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="font-semibold text-gray-900">
                {monthNames[selectedMonth.getMonth()]}
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day.charAt(0)}
                </div>
              ))}
              
              {getDaysInMonth(selectedMonth).map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>;
                }
                
                const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
                const isSelected = formatDateEuropean(date) === formatDateEuropean(selectedDate);
                const isToday = formatDateEuropean(date) === getCurrentDateEuropean();
                const appointmentsCount = getAppointmentsCountForDay(day);
                const availability = getDayAvailability(day);
                
                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => selectDate(day)}
                    className={`aspect-square rounded-full text-sm flex flex-col items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-black text-white font-semibold'
                        : isToday
                        ? 'bg-orange-200 text-orange-900 font-semibold'
                        : availability === 'full'
                        ? 'bg-red-100 text-red-900 hover:bg-red-200'
                        : availability === 'partial'
                        ? 'bg-green-100 text-green-900 hover:bg-green-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{day}</span>
                    {appointmentsCount > 0 && !isSelected && (
                      <span className="text-[8px] text-gray-500">{appointmentsCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToToday}
              className="w-full mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Danas
            </button>

            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">Legenda:</div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300"></div>
                <span className="text-gray-600">Dostupno</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-red-100 border border-red-300"></div>
                <span className="text-gray-600">Popunjeno</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full bg-orange-200 border border-orange-300"></div>
                <span className="text-gray-600">Danas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gray-50 border-b p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateDay('prev')}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedDate.getDate()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {dayNames[(selectedDate.getDay() + 6) % 7]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </div>
                  </div>

                  <button
                    onClick={() => navigateDay('next')}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  {dayAppointments.length} {dayAppointments.length === 1 ? 'termin' : 'termina'}
                </div>
              </div>

              {/* Capacity Summary */}
              {(() => {
                const isoDateStr = selectedDate.toISOString().split('T')[0];
                const capacity = capacityData.get(isoDateStr);
                
                if (!capacity || capacity.percentage === 0) return null;
                
                return (
                  <div className={`p-3 rounded-lg border-l-4 ${
                    capacity.color === 'red' ? 'bg-red-50 border-red-500' :
                    capacity.color === 'yellow' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-green-50 border-green-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Popunjenost dana</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {capacity.occupied_slots} / {capacity.total_slots} termina zauzeto
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          capacity.color === 'red' ? 'text-red-700' :
                          capacity.color === 'yellow' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          {capacity.percentage}%
                        </div>
                        <div className="text-xs text-gray-600">
                          {capacity.free_slots} slobodno
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6">
              {generateTimeSlots().length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nema radnog vremena za ovaj dan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generateTimeSlots().map((slot, index) => {
                    if (slot.type === 'free') {
                      return (
                        <div
                          key={`free-${index}`}
                          className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50"
                        >
                          <div className="flex-shrink-0 text-center">
                            <div className="text-lg font-bold text-gray-600">
                              {slot.startTime}
                            </div>
                            <div className="text-xs text-gray-500">
                              {slot.endTime}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-lg text-gray-600 mb-1">
                              Slobodno vrijeme
                            </div>
                            <div className="text-sm text-gray-500">
                              {slot.duration} minuta dostupno
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const appointment = slot.data;
                      return (
                        <div
                          key={`appointment-${appointment.id}`}
                          onClick={() => handleAppointmentClick(appointment)}
                          className={`flex items-start gap-4 p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all ${getStatusColor(appointment.status)}`}
                        >
                          <div className="flex-shrink-0 text-center">
                            <div className="text-lg font-bold">
                              {appointment.time}
                            </div>
                            <div className="text-xs opacity-75">
                              {appointment.end_time}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-lg mb-1">
                              {getServiceName(appointment.service_id)}
                            </div>
                            <div className="text-sm opacity-90 mb-2">
                              {appointment.time} - {appointment.end_time} ({slot.duration} min)
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="opacity-75">Klijent:</span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClient({
                                      id: appointment.client_id ? String(appointment.client_id) : undefined,
                                      name: appointment.client_name,
                                      phone: appointment.client_phone,
                                      email: appointment.client_email
                                    });
                                    setShowClientModal(true);
                                  }}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                >
                                  {appointment.client_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="opacity-75">Telefon:</span>
                                <span className="font-medium">{appointment.client_phone}</span>
                              </div>
                              {appointment.notes && (
                                <div className="flex items-start gap-1 mt-2 pt-2 border-t border-gray-200">
                                  <span className="opacity-75">Napomena:</span>
                                  <span className="font-medium">{appointment.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                              {appointment.client_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedAppointment && showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalji termina</h3>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Datum i vrijeme</div>
                <div className="font-medium">
                  {selectedAppointment.date} • {selectedAppointment.time} - {selectedAppointment.end_time}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Klijent</div>
                <div
                  onClick={() => {
                    setSelectedClient({
                      id: selectedAppointment.client_id ? String(selectedAppointment.client_id) : undefined,
                      name: selectedAppointment.client_name,
                      phone: selectedAppointment.client_phone,
                      email: selectedAppointment.client_email
                    });
                    setShowClientModal(true);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {selectedAppointment.client_name}
                </div>
                <div className="text-sm text-gray-600">{selectedAppointment.client_phone}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Usluga</div>
                <div className="font-medium">{getServiceName(selectedAppointment.service_id)}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Cijena</div>
                <div className="font-medium">{selectedAppointment.total_price} KM</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Status</div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <div className="text-sm text-gray-500">Napomene</div>
                  <div className="text-sm">{selectedAppointment.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedClient && (
        <ClientDetailsModal
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient?.id}
          clientName={selectedClient.name}
          clientPhone={selectedClient.phone}
          clientEmail={selectedClient.email}
        />
      )}

      {user?.staff_profile && (
        <MultiServiceManualBookingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          salonId={Number(user.staff_profile.salon_id)}
          staffId={Number(user.staff_profile.id)}
        />
      )}
    </div>
  );
}
