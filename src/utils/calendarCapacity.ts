/**
 * Calendar Capacity Utilities
 * 
 * Provides functions to calculate and visualize calendar day capacity
 * based on appointment occupancy rates.
 * 
 * @module calendarCapacity
 */

export interface DayCapacity {
  date: string; // Format: YYYY-MM-DD
  totalSlots: number;
  occupiedSlots: number;
  freeSlots: number;
  percentage: number;
  status: 'full' | 'busy' | 'available' | 'empty';
  color: 'red' | 'yellow' | 'green' | 'gray';
}

export interface CapacityColors {
  background: string;
  border: string;
  badge: string;
  text: string;
}

/**
 * Calculate day capacity based on appointments and working hours
 * 
 * @param appointments - Array of appointments for the day
 * @param workingHours - Working hours for the day (start and end time)
 * @returns DayCapacity object with calculated metrics
 */
export function calculateDayCapacity(
  appointments: any[],
  workingHours: { start: string; end: string } | null
): Omit<DayCapacity, 'date'> {
  // Calculate total available slots (30-min slots)
  const totalSlots = workingHours 
    ? calculateTotalSlots(workingHours.start, workingHours.end)
    : 16; // Default: 8 hours = 16 slots

  // Count occupied slots (confirmed, in_progress, completed)
  const occupiedSlots = appointments.filter(
    a => ['confirmed', 'in_progress', 'completed'].includes(a.status)
  ).length;

  const freeSlots = Math.max(0, totalSlots - occupiedSlots);
  const percentage = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  // Determine status and color based on percentage
  const { status, color } = getCapacityStatus(percentage);

  return {
    totalSlots,
    occupiedSlots,
    freeSlots,
    percentage: Math.round(percentage),
    status,
    color,
  };
}

/**
 * Determine capacity status and color based on percentage
 * 
 * Rules:
 * - 100%: Red (full)
 * - 70-99%: Yellow (busy)
 * - 1-69%: Green (available)
 * - 0%: Gray (empty)
 * 
 * @param percentage - Occupancy percentage (0-100)
 * @returns Status and color
 */
export function getCapacityStatus(percentage: number): {
  status: DayCapacity['status'];
  color: DayCapacity['color'];
} {
  if (percentage >= 100) {
    return { status: 'full', color: 'red' };
  } else if (percentage >= 70) {
    return { status: 'busy', color: 'yellow' };
  } else if (percentage > 0) {
    return { status: 'available', color: 'green' };
  } else {
    return { status: 'empty', color: 'gray' };
  }
}

/**
 * Get Tailwind CSS classes for capacity visualization
 * 
 * @param color - Capacity color (red, yellow, green, gray)
 * @returns Object with Tailwind CSS classes
 */
export function getCapacityColors(color: DayCapacity['color']): CapacityColors {
  const colorMap: Record<DayCapacity['color'], CapacityColors> = {
    red: {
      background: 'bg-red-50',
      border: 'border-red-500',
      badge: 'bg-red-500 text-white',
      text: 'text-red-700',
    },
    yellow: {
      background: 'bg-yellow-50',
      border: 'border-yellow-500',
      badge: 'bg-yellow-500 text-white',
      text: 'text-yellow-700',
    },
    green: {
      background: 'bg-green-50',
      border: 'border-green-500',
      badge: 'bg-green-500 text-white',
      text: 'text-green-700',
    },
    gray: {
      background: 'bg-gray-50',
      border: 'border-gray-200',
      badge: 'bg-gray-400 text-white',
      text: 'text-gray-600',
    },
  };

  return colorMap[color];
}

/**
 * Get human-readable status text
 * 
 * @param status - Capacity status
 * @returns Localized status text (Bosnian)
 */
export function getCapacityStatusText(status: DayCapacity['status']): string {
  const statusMap: Record<DayCapacity['status'], string> = {
    full: 'Potpuno popunjeno',
    busy: 'Umjereno popunjeno',
    available: 'Dostupno',
    empty: 'Nema termina',
  };

  return statusMap[status];
}

/**
 * Calculate total available slots based on working hours
 * 
 * @param start - Start time (HH:MM format)
 * @param end - End time (HH:MM format)
 * @returns Number of 30-minute slots
 */
function calculateTotalSlots(start: string, end: string): number {
  try {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;
    
    // Each slot is 30 minutes
    return Math.floor(totalMinutes / 30);
  } catch (error) {
    console.error('Error calculating total slots:', error);
    return 16; // Default: 8 hours = 16 slots
  }
}

/**
 * Group appointments by date
 * 
 * @param appointments - Array of appointments
 * @returns Map of date to appointments
 */
export function groupAppointmentsByDate(
  appointments: any[]
): Map<string, any[]> {
  const grouped = new Map<string, any[]>();

  appointments.forEach(appointment => {
    const date = appointment.date; // Assuming YYYY-MM-DD format
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(appointment);
  });

  return grouped;
}

/**
 * Calculate capacity for multiple days
 * 
 * @param appointments - Array of appointments
 * @param dates - Array of dates to calculate capacity for
 * @param workingHoursMap - Map of date to working hours
 * @returns Array of DayCapacity objects
 */
export function calculateMultiDayCapacity(
  appointments: any[],
  dates: string[],
  workingHoursMap: Map<string, { start: string; end: string } | null>
): DayCapacity[] {
  const appointmentsByDate = groupAppointmentsByDate(appointments);

  return dates.map(date => {
    const dayAppointments = appointmentsByDate.get(date) || [];
    const workingHours = workingHoursMap.get(date) || null;
    
    const capacity = calculateDayCapacity(dayAppointments, workingHours);

    return {
      date,
      ...capacity,
    };
  });
}
