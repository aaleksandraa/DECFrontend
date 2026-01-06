// European date format utilities (DD.MM.YYYY)

export const formatDateEuropean = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export const parseEuropeanDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('.');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

export const isValidEuropeanDate = (dateString: string): boolean => {
  const regex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  const [day, month, year] = dateString.split('.').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
};

export const getCurrentDateEuropean = (): string => {
  return formatDateEuropean(new Date());
};

export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString || dateString === 'Invalid Date') {
    return formatDateEuropean(new Date());
  }
  
  // If it's already in European format, return as is
  if (dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    return dateString;
  }
  
  // Try to parse and format
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return formatDateEuropean(new Date());
    }
    return formatDateEuropean(date);
  } catch {
    return formatDateEuropean(new Date());
  }
};

export const addDaysToEuropeanDate = (dateString: string, days: number): string => {
  const date = parseEuropeanDate(dateString);
  date.setDate(date.getDate() + days);
  return formatDateEuropean(date);
};

export const compareDates = (date1: string, date2: string): number => {
  const d1 = parseEuropeanDate(date1);
  const d2 = parseEuropeanDate(date2);
  return d1.getTime() - d2.getTime();
};

export const isDateInPast = (dateString: string): boolean => {
  const date = parseEuropeanDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const isDateToday = (dateString: string): boolean => {
  const date = parseEuropeanDate(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const getWeekdayName = (dateString: string, locale: string = 'sr-RS'): string => {
  const date = parseEuropeanDate(dateString);
  return date.toLocaleDateString(locale, { weekday: 'long' });
};

export const getMonthName = (dateString: string, locale: string = 'sr-RS'): string => {
  const date = parseEuropeanDate(dateString);
  return date.toLocaleDateString(locale, { month: 'long' });
};

export const formatDateTimeEuropean = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDateEuropean(d);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
};

export const formatTime24 = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Convert European date format to ISO format for API calls
export const europeanToIsoDate = (dateString: string): string => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Convert ISO date format to European format for display
export const isoToEuropeanDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return formatDateEuropean(date);
};