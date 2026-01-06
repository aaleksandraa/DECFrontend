import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InlineCalendarPickerProps {
  selectedDate: string; // DD.MM.YYYY format
  onDateSelect: (date: string) => void;
  staffId?: string;
  salonId: number;
  minDate?: string;
  availabilityData?: Record<string, 'available' | 'busy' | 'full' | 'closed'>;
  onMonthChange?: (month: string) => void; // YYYY-MM format
}

export function InlineCalendarPicker({
  selectedDate,
  onDateSelect,
  minDate,
  availabilityData = {},
  onMonthChange
}: InlineCalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Parse selected date
  const parseEuropeanDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Format date to DD.MM.YYYY
  const formatToEuropean = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Format date to YYYY-MM-DD for comparison
  const formatToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get days in month
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    // We want Monday as first day, so adjust
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday = 0
    
    const days: Date[] = [];
    
    // Add empty days for previous month
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(year, month, -startDay + i + 1);
      days.push(prevDate);
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add empty days for next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const selectedDateObj = parseEuropeanDate(selectedDate);
  const minDateObj = minDate ? parseEuropeanDate(minDate) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNames = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    if (onMonthChange) {
      const monthStr = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, '0')}`;
      onMonthChange(monthStr);
    }
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    if (onMonthChange) {
      const monthStr = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, '0')}`;
      onMonthChange(monthStr);
    }
  };

  const handleDayClick = (date: Date) => {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    // Check if date is in the past
    if (dateObj < today) return;
    
    // Check if date is before minDate
    if (minDateObj) {
      const minDateCopy = new Date(minDateObj);
      minDateCopy.setHours(0, 0, 0, 0);
      if (dateObj < minDateCopy) return;
    }
    
    // Check if date is in different month
    if (date.getMonth() !== currentMonth.getMonth()) return;
    
    onDateSelect(formatToEuropean(date));
  };

  const getDayStatus = (date: Date): string => {
    const isoDate = formatToISO(date);
    const status = availabilityData[isoDate];
    
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    // Check if in past
    if (dateObj < today) return 'past';
    
    // Check if different month
    if (date.getMonth() !== currentMonth.getMonth()) return 'other-month';
    
    // Check availability
    if (status === 'closed') return 'closed';
    if (status === 'full') return 'full';
    if (status === 'busy') return 'busy';
    if (status === 'available') return 'available';
    
    return 'unknown';
  };

  const getDayClasses = (date: Date): string => {
    const status = getDayStatus(date);
    const isSelected = selectedDateObj && 
      date.getDate() === selectedDateObj.getDate() &&
      date.getMonth() === selectedDateObj.getMonth() &&
      date.getFullYear() === selectedDateObj.getFullYear();
    
    const isToday = 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    let classes = 'relative h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all ';
    
    if (status === 'past' || status === 'other-month') {
      classes += 'text-gray-300 cursor-not-allowed ';
    } else if (status === 'closed') {
      // Neradni dan - sivo, disabled
      classes += 'bg-gray-100 text-gray-400 cursor-not-allowed ';
    } else if (status === 'full') {
      // Nema termina - crveno, disabled
      classes += 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed ';
    } else if (status === 'busy') {
      // Neki termini zauzeti - žuto, klikabilno
      classes += 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 cursor-pointer ';
    } else if (status === 'available') {
      // Ima dostupnih termina - zeleno, klikabilno
      classes += 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200 cursor-pointer ';
    } else {
      // Unknown - sivo sa hover
      classes += 'bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer ';
    }
    
    if (isSelected) {
      classes += 'ring-2 ring-blue-600 ';
    }
    
    if (isToday && !isSelected) {
      classes += 'ring-1 ring-blue-400 ';
    }
    
    return classes;
  };

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
    'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h3 className="text-base font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleDayClick(date)}
            disabled={getDayStatus(date) === 'past' || getDayStatus(date) === 'other-month' || getDayStatus(date) === 'closed' || getDayStatus(date) === 'full'}
            className={getDayClasses(date)}
          >
            {date.getDate()}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-gray-600">Dostupno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">Zauzeto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-600">Popunjeno</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-gray-600">Zatvoreno</span>
          </div>
        </div>
      </div>
    </div>
  );
}
