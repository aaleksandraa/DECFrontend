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
  Filter,
  Users,
  LayoutGrid,
  Columns,
  CalendarDays,
  Plus,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, staffAPI, serviceAPI } from '../../services/api';
import { formatDateEuropean, getCurrentDateEuropean } from '../../utils/dateUtils';
import { formatTime, formatTimeRange } from '../../utils/timeFormat';
import { ClientDetailsModal } from '../Common/ClientDetailsModal';
import { MultiServiceManualBookingModal } from '../Common/MultiServiceManualBookingModal';
import { SalonCalendarWeekView } from './SalonCalendarWeekView';
import { SalonCalendarDayView } from './SalonCalendarDayView';

export function SalonCalendar() {
  const { user } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [highlightedAppointment, setHighlightedAppointment] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
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
    loadCapacityData();
  }, [user, currentDate]); // Reload when month changes

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
    if (!user?.salon) return;

    const currentSelectedDate = selectedDate;

    try {
      setLoading(true);
      
      // Calculate date range for current month view
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Format dates for API (DD.MM.YYYY)
      const startDate = `${String(firstDay.getDate()).padStart(2, '0')}.${String(firstDay.getMonth() + 1).padStart(2, '0')}.${firstDay.getFullYear()}`;
      const endDate = `${String(lastDay.getDate()).padStart(2, '0')}.${String(lastDay.getMonth() + 1).padStart(2, '0')}.${lastDay.getFullYear()}`;
      
      // Load appointments, staff, and services
      // Only load appointments for current month to improve performance
      const [appointmentsData, staffData, servicesData] = await Promise.all([
        appointmentAPI.getAppointments({ 
          per_page: 1000, // Reasonable limit for one month
          start_date: startDate,
          end_date: endDate
        }),
        staffAPI.getStaff(user.salon.id),
        serviceAPI.getServices(user.salon.id)
      ]);
      
      // Handle paginated or array responses
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
      const staffArray = Array.isArray(staffData) ? staffData : (staffData?.data || []);
      const servicesArray = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
      
      // Filter appointments for this salon
      const salonAppointments = appointmentsArray.filter((app: any) => app.salon_id === user?.salon?.id);
      
      setAppointments(salonAppointments);
      setStaff(staffArray);
      setServices(servicesArray);

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
    if (!user?.salon?.id) return;

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      
      const response = await appointmentAPI.getMonthCapacity(monthStr);
      
      // Convert array to Map for quick lookup
      const capacityMap = new Map();
      response.capacity.forEach((item: any) => {
        capacityMap.set(item.date, item);
      });
      
      setCapacityData(capacityMap);
    } catch (error) {
      console.error('Error loading capacity data:', error);
    }
  };

  // Refresh appointments without changing selected date
  const refreshAppointments = async () => {
    if (!user?.salon?.id) return;
    
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
        end_date: endDate
      });
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
      const salonAppointments = appointmentsArray.filter((app: any) => app.salon_id === user?.salon?.id);
      setAppointments(salonAppointments);
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
    let dayAppointments = appointments.filter(app => app.date === dateStr);
    
    if (selectedStaff !== 'all') {
      dayAppointments = dayAppointments.filter(app => String(app.staff_id) === String(selectedStaff));
    }
    
    return dayAppointments;
  };

  const handleDateClick = (day: number) => {
    if (!day) return;
    
    const dateStr = formatDateEuropean(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setSelectedDate(dateStr);
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel') => {
    // Confirm before cancelling
    if (action === 'cancel') {
      const confirmed = window.confirm('Da li ste sigurni da želite otkazati ovaj termin?');
      if (!confirmed) return;
    }

    try {
      const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'in_progress': return 'U toku';
      case 'confirmed': return 'Potvrđen';
      case 'pending': return 'Na čekanju';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  const getServiceName = (appointment: any) => {
    // Priority 1: Use service_name from backend (already formatted for multi-service)
    if (appointment.service_name) {
      return appointment.service_name;
    }
    
    // Priority 2: Use services array if available
    if (appointment.services && appointment.services.length > 0) {
      return appointment.services.map((s: any) => s.name).join(', ');
    }
    
    // Priority 3: Use service object if available
    if (appointment.service) {
      return appointment.service.name;
    }
    
    // Priority 4: Fallback to looking up by service_id
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
    .filter(app => {
      const matchesDate = app.date === selectedDate;
      const matchesStaff = selectedStaff === 'all' || String(app.staff_id) === String(selectedStaff);
      return matchesDate && matchesStaff;
    })
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

  // If week view is selected, render the week view component
  if (viewMode === 'week') {
    return <SalonCalendarWeekView onViewChange={setViewMode} />;
  }

  // If day view is selected, render the day view component
  if (viewMode === 'day') {
    return <SalonCalendarDayView onViewChange={setViewMode} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kalendar salona</h1>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Add Appointment Button */}
          <button
            onClick={() => setShowBookingModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Dodaj termin</span>
            <span className="sm:hidden">Dodaj</span>
          </button>
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

          {/* Staff Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
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
                return <div key={`empty-${index}`} className="p-1 sm:p-2 h-10 sm:h-20"></div>;
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
                  key={`day-${day}`}
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
                        {formatTimeRange(appointment.time, appointment.end_time)}
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
            <div className="space-y-4">
              {selectedDateAppointments.length > 0 ? (
                selectedDateAppointments.map(appointment => (
                  <div 
                    key={appointment.id} 
                    className={`border rounded-lg p-4 transition-all duration-300 ${
                      highlightedAppointment === appointment.id 
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500 ring-opacity-50 animate-pulse' 
                        : 'border-gray-200'
                    }`}
                    id={`appointment-${appointment.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatTimeRange(appointment.time, appointment.end_time)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
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
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full ml-2">Ručno dodato</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{appointment.client_phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{getStaffName(appointment.staff_id)}</span>
                      </div>
                      
                      <div className="text-gray-600">
                        <strong>Usluga:</strong> {getServiceName(appointment)}
                      </div>
                      
                      <div className="text-gray-600">
                        <strong>Cijena:</strong> {appointment.total_price} KM
                      </div>
                      
                      {appointment.notes && (
                        <div className="text-gray-600">
                          <strong>Napomene:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {appointment.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Potvrdi
                        </button>
                        <button
                          onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                          className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Odbaci
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nema termina za ovaj datum</p>
                  {selectedStaff !== 'all' && (
                    <p className="text-sm">za izabranog zaposlenog</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Service Manual Booking Modal */}
      {user?.salon?.id && (
        <MultiServiceManualBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={refreshAppointments}
          salonId={Number(user.salon.id)}
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
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientPhone={selectedClient.phone}
          clientEmail={selectedClient.email}
        />
      )}
    </div>
  );
}