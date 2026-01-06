import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface EuropeanDatePickerProps {
  value: string; // DD.MM.YYYY format
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
}

const DAYS = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];

export function EuropeanDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Izaberite datum',
  className = ''
}: EuropeanDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse DD.MM.YYYY to Date
  const parseEuropeanDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  // Format Date to DD.MM.YYYY
  const formatToEuropean = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Initialize current month from value or current date
  useEffect(() => {
    const parsed = parseEuropeanDate(value);
    if (parsed) {
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    } else {
      // Start with current month if no value
      setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    }
  }, [value]);

  // Check position and determine if should open upward
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 280px below and more space above, open upward
      setOpenUpward(spaceBelow < 280 && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Get Monday as first day of week (0 = Monday, 6 = Sunday)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of current month only
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    const selected = parseEuropeanDate(value);
    if (!selected) return false;
    return date.toDateString() === selected.toDateString();
  };



  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(formatToEuropean(date));
    setIsOpen(false);
  };

  // Check if we can go to previous month (not before current month)
  const canGoPrevMonth = (): boolean => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    return prevMonth >= currentMonthStart;
  };

  // Check if we can go to next month (allow up to 3 months ahead)
  const canGoNextMonth = (): boolean => {
    const today = new Date();
    const maxAllowedMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return nextMonth <= maxAllowedMonth;
  };

  const goToPrevMonth = () => {
    if (canGoPrevMonth()) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }
  };

  const goToNextMonth = () => {
    if (canGoNextMonth()) {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer flex items-center justify-between bg-white"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 left-0 right-0 ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
          style={{ minWidth: '240px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={goToPrevMonth}
              disabled={!canGoPrevMonth()}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              type="button"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="font-medium text-gray-900 text-sm">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={!canGoNextMonth()}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              type="button"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 mb-0.5">
            {DAYS.map((day, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              // Empty cell for days before month starts
              if (!date) {
                return <div key={`empty-${index}`} className="w-7 h-7 m-px" />;
              }
              
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={disabled}
                  type="button"
                  className={`
                    w-7 h-7 text-[11px] rounded transition-colors flex items-center justify-center m-px
                    ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-orange-100 cursor-pointer'}
                    ${selected ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
                    ${today && !selected ? 'ring-1 ring-orange-400 font-bold' : ''}
                    ${!disabled && !selected ? 'text-gray-900' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
