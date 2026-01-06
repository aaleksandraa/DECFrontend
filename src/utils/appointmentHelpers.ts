import { Appointment, Service } from '../types';

/**
 * Get service name(s) for an appointment.
 * Handles both single-service and multi-service appointments.
 * 
 * Priority:
 * 1. Use service_name from backend (already formatted)
 * 2. Use services array if available
 * 3. Use service object if available
 * 4. Fallback to looking up by service_id
 */
export const getAppointmentServiceName = (
  appointment: Appointment,
  allServices?: Service[]
): string => {
  // Priority 1: Use service_name from backend (already formatted for multi-service)
  if (appointment.service_name) {
    return appointment.service_name;
  }

  // Priority 2: Use services array if available
  if (appointment.services && appointment.services.length > 0) {
    return appointment.services.map(s => s.name).join(', ');
  }

  // Priority 3: Use service object if available
  if (appointment.service) {
    return appointment.service.name;
  }

  // Priority 4: Fallback to looking up by service_id
  if (appointment.service_id && allServices) {
    const service = allServices.find(s => s.id === appointment.service_id);
    if (service) {
      return service.name;
    }
  }

  return 'Nepoznata usluga';
};

/**
 * Get all services for an appointment as an array.
 * Useful for displaying service details.
 */
export const getAppointmentServices = (
  appointment: Appointment,
  allServices?: Service[]
): Service[] => {
  // Use services array if available
  if (appointment.services && appointment.services.length > 0) {
    return appointment.services;
  }

  // Use service object if available
  if (appointment.service) {
    return [appointment.service];
  }

  // Fallback to looking up by service_id
  if (appointment.service_id && allServices) {
    const service = allServices.find(s => s.id === appointment.service_id);
    if (service) {
      return [service];
    }
  }

  return [];
};

/**
 * Check if appointment has multiple services
 */
export const isMultiServiceAppointment = (appointment: Appointment): boolean => {
  return appointment.is_multi_service || 
         (appointment.services && appointment.services.length > 1) ||
         (appointment.service_ids && appointment.service_ids.length > 1) ||
         false;
};
