# Update getServiceName in All Components

## Components to Update

1. ✅ SalonCalendarDayView.tsx - DONE
2. SalonCalendarWeekView.tsx
3. SalonCalendar.tsx
4. SalonAppointments.tsx
5. FrizerCalendarDayView.tsx
6. FrizerCalendarWeekView.tsx
7. FrizerCalendar.tsx
8. FrizerReportModal.tsx

## Pattern to Replace

### Old:
```typescript
const getServiceName = (serviceId: string) => {
  const service = services.find(s => s.id === serviceId);
  return service?.name || 'Nepoznata usluga';
};

// Usage:
getServiceName(appointment.service_id)
```

### New:
```typescript
const getServiceName = (appointment: any) => {
  // Priority 1: Use service_name from backend
  if (appointment.service_name) {
    return appointment.service_name;
  }
  
  // Priority 2: Use services array
  if (appointment.services && appointment.services.length > 0) {
    return appointment.services.map((s: any) => s.name).join(', ');
  }
  
  // Priority 3: Use service object
  if (appointment.service) {
    return appointment.service.name;
  }
  
  // Priority 4: Fallback to service_id lookup
  if (appointment.service_id) {
    const service = services.find(s => s.id === appointment.service_id);
    return service?.name || 'Nepoznata usluga';
  }
  
  return 'Nepoznata usluga';
};

// Usage:
getServiceName(appointment)
```
