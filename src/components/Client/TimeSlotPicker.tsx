import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { salonAPI } from '../../services/api';
import { isDateToday } from '../../utils/dateUtils';

interface SelectedService {
  id: string;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    discount_price?: number | null;
  };
  staffId: string;
}

interface TimeSlotPickerProps {
  salonId: string;
  staffId: string;
  serviceDuration: number;
  selectedDate: string;
  selectedServices: SelectedService[];
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
}

export function TimeSlotPicker({ 
  salonId,
  staffId,
  serviceDuration,
  selectedDate,
  selectedServices,
  onTimeSelect,
  selectedTime 
}: TimeSlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate total duration from all selected services
  const totalDuration = useMemo(() => {
    const calculated = selectedServices.reduce((sum, s) => sum + (s.service?.duration || 0), 0);
    console.log('TimeSlotPicker - Total duration:', calculated, 'from', selectedServices.length, 'services');
    return calculated || serviceDuration;
  }, [selectedServices, serviceDuration]);

  // Create a key to detect changes
  const servicesKey = useMemo(() => {
    return `${staffId}|${selectedServices.map(s => s.id).join(',')}|${totalDuration}`;
  }, [staffId, selectedServices, totalDuration]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!salonId || !selectedDate || !staffId || selectedServices.length === 0) {
        console.log('TimeSlotPicker - Missing data:', { salonId, selectedDate, staffId, servicesCount: selectedServices.length });
        setAvailableSlots([]);
        return;
      }

      setLoading(true);
      try {
        // Build services data - all services use the same staffId
        const servicesData = selectedServices.map(s => ({
          serviceId: s.id,
          staffId: staffId, // Same staff for all services
          duration: s.service.duration
        }));

        console.log('TimeSlotPicker - API Request:', {
          salonId,
          selectedDate,
          servicesData,
          totalDuration
        });

        const response = await salonAPI.getAvailableSlotsForMultipleServices(
          salonId,
          selectedDate,
          servicesData
        );

        console.log('TimeSlotPicker - API Response:', response.slots?.length || 0, 'slots');

        let slots = response.slots || [];

        // Filter past slots if today
        if (isDateToday(selectedDate)) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          slots = slots.filter((slot: string) => {
            const [h, m] = slot.split(':').map(Number);
            return h * 60 + m > currentMinutes + 30;
          });
        }

        setAvailableSlots(slots);
      } catch (error) {
        console.error('TimeSlotPicker - Error:', error);
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [salonId, selectedDate, servicesKey, staffId, selectedServices, totalDuration]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-sm text-gray-600">Učitavanje termina...</span>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nema dostupnih termina</h3>
        <p className="text-gray-600 text-sm">
          Za izabrani datum ({selectedDate}) nema slobodnih termina.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Ukupno trajanje: {totalDuration} min ({selectedServices.length} usluga)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          <span className="font-medium text-gray-900">Dostupni termini</span>
        </div>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {availableSlots.length} termina
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Ukupno trajanje: <strong>{totalDuration} min</strong> ({selectedServices.length} usluga)
      </p>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {availableSlots.map((slot) => (
          <button
            key={slot}
            onClick={() => onTimeSelect(slot)}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              selectedTime === slot
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          Termini su filtrirani tako da ima dovoljno vremena za sve usluge ({totalDuration} min).
        </p>
      </div>
    </div>
  );
}
