/**
 * Format time string to HH:MM format (remove seconds if present)
 * 
 * Examples:
 * - "09:30" → "09:30"
 * - "09:30:00" → "09:30"
 * - "10:00:00" → "10:00"
 */
export const formatTime = (time: string | undefined | null): string => {
  if (!time) return '';
  
  // Split by colon and take only hours and minutes
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  
  return time;
};

/**
 * Format time range (start - end)
 * 
 * Example:
 * - formatTimeRange("09:30:00", "10:00:00") → "09:30 - 10:00"
 */
export const formatTimeRange = (startTime: string | undefined | null, endTime: string | undefined | null): string => {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  
  if (!start || !end) return '';
  
  return `${start} - ${end}`;
};
