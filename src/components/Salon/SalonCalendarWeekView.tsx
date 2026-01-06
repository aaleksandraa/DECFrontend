import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Filter,
  LayoutGrid,
  Columns,
  CalendarDays,
  Plus,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, staffAPI, serviceAPI } from '../../services/api';
import { formatDateEuropean, getCurrentDateEuropean } from '../../utils/dateUtils';
import { ClientDetailsModal } from '../Common/ClientDetailsModal';
import { MultiServiceManualBookingModal } from '../Common/MultiServiceManualBookingModal';

interface SalonCalendarWeekViewProps {
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
}

export function SalonCalendarWeekView({ onViewChange }: SalonCalendarWeekViewProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [capacityData, setCapacityData] = useState<Map<string, any>>(new Map());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // Load data when component mounts or week changes
  useEffect(() => {
    loadData();
    loadCapacityData();
  }, [user, currentWeekStart]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
        setShowYearPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    if (!user?.salon) return;

    try {
      setLoading(true);
      
      // Calculate date range for current week
      const weekDays = getWeekDays();
      const startDate = formatDateEuropean(weekDays[0]);
      const endDate = formatDateEuropean(weekDays[6]);
      
      // Load appointments, staff, and services
      const [appointmentsData, staffData, servicesData] = await Promise.all([
        appointmentAPI.getAppointments({ 
          per_page: 500,
          start_date: startDate,
          end_date: endDate
        }),
        staffAPI.getStaff(user.salon.id),
        serviceAPI.getServices(user.salon.id)
      ]);
      
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
      const staffArray = Array.isArray(staffData) ? staffData : (staffData?.data || []);
      const servicesArray = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
      
      const salonAppointments = appointmentsArray.filter((app: any) => app.salon_id === user.salon.id);
      
      setAppointments(salonAppointments);
      setStaff(staffArray);
      setServices(servicesArray);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCapacityData = async () => {
    if (!user?.salon) return;

    try {
      const weekDays = getWeekDays();
      const year = weekDays[0].getFullYear();
      const month = weekDays[0].getMonth() + 1;
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

  // Get Monday of the week for a given date
  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Get working hours from salon or selected staff (earliest/latest across all days for week view)
  const getWorkingHours = () => {
    // If specific staff is selected, use their working hours
    if (selectedStaff !== 'all') {
      const staffMember = staff.find(s => String(s.id) === String(selectedStaff));
      if (staffMember?.working_hours) {
        // Extract earliest start and latest end from working hours
        const hours = staffMember.working_hours;
        let earliestStart = 24;
        let latestEnd = 0;
        
        Object.values(hours).forEach((day: any) => {
          if (day?.is_working && day.start && day.end) {
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
    }
    
    // Otherwise use salon working hours
    if (user?.salon?.working_hours) {
      const hours = user.salon.working_hours;
      let earliestStart = 24;
      let latestEnd = 0;
      
      Object.values(hours).forEach((day: any) => {
        if (day?.is_open && day.open && day.close) {
          const startHour = parseInt(day.open.split(':')[0]);
          const endHour = parseInt(day.close.split(':')[0]);
          if (startHour < earliestStart) earliestStart = startHour;
          if (endHour > latestEnd) latestEnd = endHour;
        }
      });
      
      if (earliestStart < 24 && latestEnd > 0) {
        return { start: earliestStart, end: latestEnd };
      }
    }
    
    return { start: 9, end: 17 }; // Default to 9-17 instead of 8-20
  };

  // Check if a specific day, hour and minute is within working hours
  const isWithinWorkingHours = (day: Date, hour: number, minute: number = 0): boolean => {
    const dayOfWeek = day.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayNames[dayOfWeek];
    
    const timeInMinutes = hour * 60 + minute;
    
    // If specific staff is selected, check their working hours
    if (selectedStaff !== 'all') {
      const staffMember = staff.find(s => String(s.id) === String(selectedStaff));
      if (staffMember?.working_hours?.[dayKey]) {
        const dayHours = staffMember.working_hours[dayKey];
        if (dayHours?.is_working && dayHours.start && dayHours.end) {
          const [startH, startM] = dayHours.start.split(':').map(Number);
          const [endH, endM] = dayHours.end.split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
        }
      }
      return false;
    }
    
    // Otherwise check salon working hours
    if (user?.salon?.working_hours?.[dayKey]) {
      const dayHours = user.salon.working_hours[dayKey];
      if (dayHours?.is_open && dayHours.open && dayHours.close) {
        const [startH, startM] = dayHours.open.split(':').map(Number);
        const [endH, endM] = dayHours.close.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
      }
    }
    
    return false;
  };

  const workingHours = getWorkingHours();
  const workingHoursStart = workingHours.start;
  const workingHoursEnd = workingHours.end;

  // Get 7 days starting from today (not Monday)
  const getWeekDays = () => {
    const days = [];
    const startDate = new Date(currentWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Generate 30-minute time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
      slots.push({ hour, minute: 0, label: `${String(hour).padStart(2, '0')}:00` });
      slots.push({ hour, minute: 30, label: `${String(hour).padStart(2, '0')}:30` });
    }
    return slots;
  };

  // Navigate week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'prev' ? -7 : 7));
    setCurrentWeekStart(newDate);
  };

  // Go to current week (starting from today)
  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentWeekStart(today);
  };

  // Get appointments for a specific date and 30-minute slot
  const getAppointmentsForSlot = (date: Date, hour: number, minute: number) => {
    const dateStr = formatDateEuropean(date);
    
    let dayAppointments = appointments.filter(app => {
      if (app.date !== dateStr) return false;
      
      // Check if appointment overlaps with this 30-minute slot
      const appHour = parseInt(app.time.split(':')[0]);
      const appMinute = parseInt(app.time.split(':')[1]);
      const appStartMinutes = appHour * 60 + appMinute;
      
      const endTimeParts = app.end_time.split(':');
      const appEndHour = parseInt(endTimeParts[0]);
      const appEndMinute = parseInt(endTimeParts[1]);
      const appEndMinutes = appEndHour * 60 + appEndMinute;
      
      const slotStartMinutes = hour * 60 + minute;
      const slotEndMinutes = slotStartMinutes + 30;
      
      // Check if appointment overlaps with this 30-minute slot
      return appStartMinutes < slotEndMinutes && appEndMinutes > slotStartMinutes;
    });

    if (selectedStaff !== 'all') {
      dayAppointments = dayAppointments.filter(app => String(app.staff_id) === String(selectedStaff));
    }

    return dayAppointments;
  };

  // Calculate position and height of appointment in the 30-minute slot
  const getAppointmentStyle = (appointment: any, slotHour: number, slotMinute: number) => {
    const appHour = parseInt(appointment.time.split(':')[0]);
    const appMinute = parseInt(appointment.time.split(':')[1]);
    
    const endTimeParts = appointment.end_time.split(':');
    const appEndHour = parseInt(endTimeParts[0]);
    const appEndMinute = parseInt(endTimeParts[1]);
    
    // Calculate duration in minutes
    const startMinutes = appHour * 60 + appMinute;
    const endMinutes = appEndHour * 60 + appEndMinute;
    const durationMinutes = endMinutes - startMinutes;
    
    // Calculate offset from slot start (30-minute slot)
    const slotStartMinutes = slotHour * 60 + slotMinute;
    const offsetMinutes = startMinutes - slotStartMinutes;
    const offsetPercent = (offsetMinutes / 30) * 100;
    
    // Calculate height based on duration (relative to 30-minute slot)
    const heightPercent = (durationMinutes / 30) * 100;
    
    return {
      top: `${Math.max(0, offsetPercent)}%`,
      height: `${heightPercent}%`,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'in_progress': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'confirmed': return 'bg-gray-200 border-gray-400 text-gray-800';
      case 'pending': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getServiceName = (appointment: any) => {
    if (appointment.service_name) return appointment.service_name;
    if (appointment.services && appointment.services.length > 0) {
      return appointment.services.map((s: any) => s.name).join(', ');
    }
    if (appointment.service) return appointment.service.name;
    if (appointment.service_id) {
      const service = services.find(s => s.id === appointment.service_id);
      return service?.name || 'Nepoznata usluga';
    }
    return 'Nepoznata usluga';
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || 'Nepoznat zaposleni';
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const weekDays = getWeekDays();
  const timeSlots = generateTimeSlots();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje sedmičnog rasporeda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Dostupnost</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Add Appointment Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </button>

          {/* View Mode Toggle */}
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white text-blue-600 shadow-sm"
              >
                <Columns className="w-4 h-4" />
                Sedmica
              </button>
              <button
                onClick={() => onViewChange('day')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                Dan
              </button>
            </div>
          )}

          {/* Staff Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Svi zaposleni</option>
              {staff.map(staffMember => (
                <option key={staffMember.id} value={staffMember.id}>
                  {staffMember.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Danas
          </button>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Month Picker */}
          <div className="relative" ref={monthPickerRef}>
            <button
              onClick={() => {
                setShowMonthPicker(!showMonthPicker);
                setShowYearPicker(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {monthNames[weekDays[0].getMonth()]}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showMonthPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg border p-2 grid grid-cols-3 gap-1 z-30 min-w-[240px]">
                {monthNames.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => {
                      const newDate = new Date(currentWeekStart);
                      newDate.setMonth(index);
                      setCurrentWeekStart(newDate);
                      setShowMonthPicker(false);
                    }}
                    className={`px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                      weekDays[0].getMonth() === index ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Picker */}
          <div className="relative" ref={yearPickerRef}>
            <button
              onClick={() => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {weekDays[0].getFullYear()}
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showYearPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-lg border p-2 grid grid-cols-3 gap-1 z-30 min-w-[200px] max-h-[300px] overflow-y-auto">
                {Array.from({ length: 10 }, (_, i) => weekDays[0].getFullYear() - 5 + i).map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      const newDate = new Date(currentWeekStart);
                      newDate.setFullYear(year);
                      setCurrentWeekStart(newDate);
                      setShowYearPicker(false);
                    }}
                    className={`px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                      weekDays[0].getFullYear() === year ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-sm text-gray-600">
            {weekDays[0].getDate()} {monthNames[weekDays[0].getMonth()]} - {weekDays[6].getDate()} {monthNames[weekDays[6].getMonth()]}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b-2 border-gray-200 bg-gray-50">
              <div className="p-4 text-sm font-bold text-gray-600 border-r border-gray-200 sticky left-0 bg-gray-50 z-20">
                Vrijeme
              </div>
              {weekDays.map((day, index) => {
                const isToday = formatDateEuropean(day) === getCurrentDateEuropean();
                const isoDateStr = day.toISOString().split('T')[0];
                const capacity = capacityData.get(isoDateStr);
                const dayOfWeek = day.getDay();
                const dayNamesForHeader = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
                
                return (
                  <div
                    key={index}
                    className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`text-sm font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                      {dayNamesForHeader[dayOfWeek]}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {day.getDate()}.{day.getMonth() + 1}.
                    </div>
                    {/* Capacity badge */}
                    {capacity && capacity.percentage > 0 && (
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          capacity.color === 'red' ? 'bg-red-500 text-white' :
                          capacity.color === 'yellow' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        }`}>
                          {capacity.percentage}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time slots - 30 minute intervals */}
            <div className="relative">
              {timeSlots.map((slot) => {
                return (
                <div 
                  key={`${slot.hour}-${slot.minute}`} 
                  className={`grid grid-cols-8 transition-all bg-white ${
                    slot.minute === 0 
                      ? 'border-b-2 border-gray-200' 
                      : 'border-b border-dashed border-gray-100'
                  }`} 
                  style={{ minHeight: '70px' }}
                >
                  {/* Time label - Clean styling */}
                  <div className={`p-3 text-sm border-r border-gray-200 flex items-center sticky left-0 z-10 bg-white ${
                    slot.minute === 0 
                      ? 'text-gray-800 font-semibold' 
                      : 'text-gray-500 font-normal'
                  }`}>
                    {slot.label}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIndex) => {
                    const slotAppointments = getAppointmentsForSlot(day, slot.hour, slot.minute);
                    const isToday = formatDateEuropean(day) === getCurrentDateEuropean();
                    const isWorkingHour = isWithinWorkingHours(day, slot.hour, slot.minute);

                    return (
                      <div
                        key={dayIndex}
                        className={`relative border-r border-gray-200 last:border-r-0 transition-colors ${
                          isToday ? 'bg-blue-50/50' : ''
                        } ${!isWorkingHour ? 'bg-gray-100' : ''}`}
                      >
                        {/* Show "Zatvoreno" ONLY when NOT working hours AND no appointments */}
                        {!isWorkingHour && slot.minute === 0 && slotAppointments.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-gray-400">Zatvoreno</span>
                          </div>
                        )}
                        
                        {/* Show appointments */}
                        {slotAppointments.map((appointment) => {
                          const appHour = parseInt(appointment.time.split(':')[0]);
                          const appMinute = parseInt(appointment.time.split(':')[1]);
                          const appStartMinutes = appHour * 60 + appMinute;
                          const slotStartMinutes = slot.hour * 60 + slot.minute;
                          
                          // Only render if this is the starting slot
                          if (appStartMinutes !== slotStartMinutes) return null;

                          const style = getAppointmentStyle(appointment, slot.hour, slot.minute);
                          
                          // Parse additional services from notes
                          const additionalServices = appointment.notes 
                            ? appointment.notes.replace('Dodatne usluge: ', '').split(', ').filter((s: string) => s.trim())
                            : [];

                          return (
                            <div
                              key={appointment.id}
                              className={`absolute left-1.5 right-1.5 rounded-lg border-2 p-2 cursor-pointer hover:shadow-lg transition-all overflow-hidden shadow-sm ${getStatusColor(appointment.status)}`}
                              style={style}
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              <div className="text-xs font-bold truncate mb-1">
                                {appointment.time} - {appointment.end_time}
                              </div>
                              <div className="text-xs font-semibold truncate mb-1">
                                {appointment.client_name}
                              </div>
                              <div className="text-xs truncate opacity-90">
                                {getServiceName(appointment)}
                              </div>
                              {selectedStaff === 'all' && (
                                <div className="text-xs truncate opacity-75 mt-1">
                                  👤 {getStaffName(appointment.staff_id)}
                                </div>
                              )}
                              {additionalServices.length > 0 && additionalServices.map((service: string, idx: number) => (
                                <div key={idx} className="text-xs truncate opacity-90 mt-0.5">
                                  {service}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
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
                <div className="text-sm text-gray-500">Zaposleni</div>
                <div className="font-medium">{getStaffName(selectedAppointment.staff_id)}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Usluga</div>
                <div className="font-medium">{getServiceName(selectedAppointment)}</div>
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

      {/* Client Details Modal */}
      {selectedClient && (
        <ClientDetailsModal
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientPhone={selectedClient.phone}
          clientEmail={selectedClient.email}
        />
      )}

      {/* Manual Booking Modal */}
      {user?.salon && (
        <MultiServiceManualBookingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          salonId={Number(user.salon.id)}
        />
      )}
    </div>
  );
}
