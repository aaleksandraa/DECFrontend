import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  Play,
  Plus,
  MessageSquare,
  Scissors,
  LayoutGrid,
  Columns,
  CalendarDays,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, staffAPI, serviceAPI } from '../../services/api';
import { formatDateEuropean, getCurrentDateEuropean } from '../../utils/dateUtils';
import { formatTime, formatTimeRange } from '../../utils/timeFormat';
import { MultiServiceManualBookingModal } from '../Common/MultiServiceManualBookingModal';
import { ClientDetailsModal } from '../Common/ClientDetailsModal';
import { FrizerCalendarWeekView } from './FrizerCalendarWeekView';
import { FrizerCalendarDayView } from './FrizerCalendarDayView';

export function FrizerCalendar() {
  const { user } = useAuth();
  const location = useLocation();
  const [staff, setStaff] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [highlightedAppointment, setHighlightedAppointment] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [capacityData, setCapacityData] = useState<Map<string, any>>(new Map());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // Read date and appointment from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlDate = params.get('date');
    const urlAppointment = params.get('appointment');
    
    if (urlDate) {
      setSelectedDate(urlDate);
      // Set currentDate to show the right month
      const [year, month] = urlDate.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, 1));
    }
    
    if (urlAppointment) {
      setHighlightedAppointment(parseInt(urlAppointment));
      // Scroll to highlighted appointment after a short delay
      setTimeout(() => {
        const element = document.getElementById(`appointment-${urlAppointment}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      // Clear highlight after 5 seconds
      setTimeout(() => setHighlightedAppointment(null), 5000);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [user]);

  // Reload appointments and capacity when month changes
  useEffect(() => {
    if (user?.staff_profile) {
      loadAppointmentsForMonth();
      loadCapacityData();
    }
  }, [currentDate, user]);

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

  const loadData = async (keepSelectedDate = false) => {
    if (!user?.staff_profile) return;

    const currentSelectedDate = selectedDate; // Save current selected date

    try {
      setLoading(true);
      
      // Load staff data
      const staffData = await staffAPI.getStaffMember(user.staff_profile.salon_id, user.staff_profile.id);
      setStaff(staffData);

      // Load appointments
      const appointmentsData = await staffAPI.getAppointments(user.staff_profile.salon_id, user.staff_profile.id);
      setAppointments(appointmentsData.appointments || []);

      // Load services - API returns { data: [...] } format
      const servicesResponse = await serviceAPI.getServices(user.staff_profile.salon_id);
      const servicesArray = Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse.data || []);
      setServices(servicesArray.filter((s: any) => s.staff_ids?.includes(user.staff_profile?.id)));

      // Set today as selected date only if not keeping current date
      if (!keepSelectedDate || !currentSelectedDate) {
        const today = getCurrentDateEuropean();
        setSelectedDate(today);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCapacityData = async () => {
    if (!user?.staff_profile) return;

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
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

  // Load appointments for the current month view
  const loadAppointmentsForMonth = async () => {
    if (!user?.staff_profile) return;

    try {
      // Calculate date range for current month view
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Format dates for API (DD.MM.YYYY)
      const startDate = `${String(firstDay.getDate()).padStart(2, '0')}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${firstDay.getFullYear()}`;
      const endDate = `${String(lastDay.getDate()).padStart(2, '0')}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${lastDay.getFullYear()}`;
      
      // Load appointments for this month only
      const appointmentsData = await appointmentAPI.getAppointments({ 
        per_page: 1000,
        start_date: startDate,
        end_date: endDate,
        staff_id: user.staff_profile.id
      });
      
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
      setAppointments(appointmentsArray);
    } catch (error) {
      console.error('Error loading appointments for month:', error);
    }
  };

  // Refresh appointments without changing selected date
  const refreshAppointments = async () => {
    if (!user?.staff_profile) return;
    
    try {
      // Calculate date range for current month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = `${String(firstDay.getDate()).padStart(2, '0')}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${firstDay.getFullYear()}`;
      const endDate = `${String(lastDay.getDate()).padStart(2, '0')}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${lastDay.getFullYear()}`;
      
      const appointmentsData = await appointmentAPI.getAppointments({ 
        per_page: 1000,
        start_date: startDate,
        end_date: endDate,
        staff_id: user.staff_profile.id
      });
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
      setAppointments(appointmentsArray);
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We want Monday (1) to be 0, Tuesday (2) to be 1, ..., Sunday (0) to be 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // Sunday becomes last day

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAppointmentsForDay = (day: number) => {
    if (!day) return [];
    
    const dateStr = formatDateEuropean(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return appointments.filter(app => app.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    if (!day) return;
    
    const dateStr = formatDateEuropean(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setSelectedDate(dateStr);
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'start' | 'complete' | 'cancel') => {
    // Confirm before cancelling
    if (action === 'cancel') {
      const confirmed = window.confirm('Da li ste sigurni da želite otkazati ovaj termin?');
      if (!confirmed) return;
    }

    try {
      let newStatus: string;
      switch (action) {
        case 'start':
          newStatus = 'in_progress';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
        default:
          return;
      }

      await appointmentAPI.updateAppointment(appointmentId, { status: newStatus });
      
      // Refresh appointments without changing selected date
      refreshAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'in_progress': return 'U toku';
      case 'confirmed': return 'Potvrđen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  const getServiceName = (appointment: any) => {
    if (appointment.service_name) return appointment.service_name;
    if (appointment.services?.length > 0) {
      return appointment.services.map((s: any) => s.name).join(', ');
    }
    if (appointment.service) return appointment.service.name;
    if (appointment.service_id) {
      const service = services.find(s => s.id === appointment.service_id);
      return service?.name || 'Nepoznata usluga';
    }
    return 'Nepoznata usluga';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const dayNames = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

  const selectedDateAppointments = appointments
    .filter(app => app.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje kalendara...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profil nije pronađen</h3>
        <p className="text-gray-600">Kontaktirajte administratora salona da vam kreira profil.</p>
      </div>
    );
  }

  // If week view is selected, render the week view component
  if (viewMode === 'week') {
    return <FrizerCalendarWeekView onViewChange={setViewMode} />;
  }

  // If day view is selected, render the day view component
  if (viewMode === 'day') {
    return <FrizerCalendarDayView onViewChange={setViewMode} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kalendar termina</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Mjesec</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Sedmica</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Dan</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Dodaj termin</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-3 sm:p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              {/* Month Picker */}
              <div className="relative" ref={monthPickerRef}>
                <button
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-base sm:text-xl font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {monthNames[currentDate.getMonth()]}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showMonthPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg border p-2 grid grid-cols-3 gap-1 z-30 min-w-[240px]">
                    {monthNames.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setMonth(index);
                          setCurrentDate(newDate);
                          setShowMonthPicker(false);
                        }}
                        className={`px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                          currentDate.getMonth() === index ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700'
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
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-base sm:text-xl font-semibold text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {currentDate.getFullYear()}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showYearPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg border p-2 grid grid-cols-3 gap-1 z-30 min-w-[200px] max-h-[300px] overflow-y-auto">
                    {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i).map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setFullYear(year);
                          setCurrentDate(newDate);
                          setShowYearPicker(false);
                        }}
                        className={`px-3 py-2 text-sm rounded hover:bg-blue-50 transition-colors ${
                          currentDate.getFullYear() === year ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setSelectedDate(getCurrentDateEuropean());
                }}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Danas
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
            
            {/* Calendar days */}
            {getDaysInMonth(currentDate).map((day, index) => {
              if (!day) {
                return <div key={index} className="p-1 sm:p-2 h-10 sm:h-20"></div>;
              }
              
              const dayAppointments = getAppointmentsForDay(day);
              const dateStr = formatDateEuropean(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === getCurrentDateEuropean();
              
              // Get capacity data for this day
              const isoDateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
              const capacity = capacityData.get(isoDateStr);
              
              // Determine background color based on capacity
              let capacityBg = '';
              let capacityBorder = '';
              if (capacity) {
                if (capacity.color === 'red') {
                  capacityBg = 'bg-red-50';
                  capacityBorder = 'border-red-300';
                } else if (capacity.color === 'yellow') {
                  capacityBg = 'bg-yellow-50';
                  capacityBorder = 'border-yellow-300';
                } else if (capacity.color === 'green') {
                  capacityBg = 'bg-green-50';
                  capacityBorder = 'border-green-300';
                }
              }
              
              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`p-1 sm:p-2 h-10 sm:h-20 border cursor-pointer hover:bg-gray-50 transition-colors rounded-sm sm:rounded ${
                    isSelected ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-300' : 
                    isToday ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-300' : 
                    `${capacityBg} ${capacityBorder || 'border-gray-200'}`
                  }`}
                >
                  <div className={`text-xs sm:text-sm font-medium ${
                    isToday ? 'text-orange-600' : isSelected ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day}
                  </div>
                  {/* Desktop: show appointment times and capacity */}
                  <div className="hidden sm:block space-y-1 mt-1">
                    {dayAppointments.slice(0, 2).map(appointment => (
                      <div
                        key={appointment.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(appointment.status)}`}
                      >
                        {appointment.time}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayAppointments.length - 2} više
                      </div>
                    )}
                    {/* Capacity indicator */}
                    {capacity && capacity.percentage > 0 && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${
                              capacity.color === 'red' ? 'bg-red-500' :
                              capacity.color === 'yellow' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${capacity.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-gray-500 text-center mt-0.5">
                          {capacity.percentage}%
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Mobile: compact dot indicator with capacity */}
                  {dayAppointments.length > 0 && (
                    <div className="sm:hidden flex items-center justify-center mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        capacity?.color === 'red' ? 'bg-red-500' :
                        capacity?.color === 'yellow' ? 'bg-yellow-500' :
                        capacity?.color === 'green' ? 'bg-green-500' :
                        dayAppointments.some(a => a.status === 'pending') ? 'bg-yellow-500' :
                        dayAppointments.some(a => a.status === 'confirmed') ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}></div>
                      {dayAppointments.length > 1 && (
                        <span className="text-[10px] text-gray-500 ml-0.5">{dayAppointments.length}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {selectedDate ? selectedDate : 'Izaberite datum'}
            </h3>
          </div>

          {selectedDate && (
            <div className="space-y-3 sm:space-y-4">
              {selectedDateAppointments.length > 0 ? (
                selectedDateAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      highlightedAppointment === appointment.id 
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500 ring-opacity-50 animate-pulse' 
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                    id={`appointment-${appointment.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-semibold text-gray-900">
                          {formatTimeRange(appointment.time, appointment.end_time)}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {/* Client Name - Clickable */}
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span
                          onClick={() => {
                            setSelectedClient({
                              id: appointment.client_id ? String(appointment.client_id) : undefined,
                              name: appointment.client_name,
                              phone: appointment.client_phone,
                              email: appointment.client_email
                            });
                            setShowClientModal(true);
                          }}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          {appointment.client_name}
                        </span>
                        {appointment.is_guest && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Ručno dodano</span>
                        )}
                      </div>
                      
                      {/* Phone - Clickable */}
                      {appointment.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-500" />
                          <a 
                            href={`tel:${appointment.client_phone}`}
                            className="text-green-600 hover:text-green-800 font-medium hover:underline"
                          >
                            {appointment.client_phone}
                          </a>
                        </div>
                      )}
                      
                      {/* Service */}
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-700">{getServiceName(appointment)}</span>
                        <span className="text-gray-500">•</span>
                        <span className="font-semibold text-gray-900">{appointment.total_price} KM</span>
                      </div>
                      
                      {/* Notes - Highlighted */}
                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-yellow-700 uppercase">Napomena:</span>
                              <p className="text-sm text-yellow-800 mt-1">{appointment.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'start')}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Počni
                        </button>
                      )}
                      
                      {appointment.status === 'in_progress' && (
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Završi
                        </button>
                      )}
                      
                      {(appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                          className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Otkaži
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nema termina za ovaj datum</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj termin
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Service Manual Booking Modal */}
      {user?.staff_profile && (
        <MultiServiceManualBookingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={refreshAppointments}
          salonId={Number(user.staff_profile.salon_id)}
          staffId={Number(user.staff_profile.id)}
          preselectedDate={selectedDate}
        />
      )}

      {/* Client Details Modal */}
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
    </div>
  );
}