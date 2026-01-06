import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface EmailFormData {
  subject: string;
  message: string;
  selectedClients: number[];
}

interface AppointmentFormData {
  clientId?: number;
  serviceIds?: string[]; // Multiple services
  staffIds?: string[]; // Multiple staff members
  date?: string;
  time?: string;
  notes?: string;
  // Guest booking data
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestAddress?: string;
}

interface ServiceFormData {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  category?: string;
}

interface FormStore {
  // Email form state
  emailForm: EmailFormData;
  setEmailForm: (data: Partial<EmailFormData>) => void;
  clearEmailForm: () => void;

  // Appointment form state
  appointmentForm: AppointmentFormData;
  setAppointmentForm: (data: Partial<AppointmentFormData>) => void;
  clearAppointmentForm: () => void;

  // Service form state
  serviceForm: ServiceFormData;
  setServiceForm: (data: Partial<ServiceFormData>) => void;
  clearServiceForm: () => void;

  // Search and filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  lastVisitFilter: string;
  setLastVisitFilter: (filter: string) => void;

  // Clear all forms
  clearAllForms: () => void;
}

const initialEmailForm: EmailFormData = {
  subject: '',
  message: '',
  selectedClients: [],
};

const initialAppointmentForm: AppointmentFormData = {};
const initialServiceForm: ServiceFormData = {};

export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      // Email form
      emailForm: initialEmailForm,
      setEmailForm: (data) =>
        set((state) => ({
          emailForm: { ...state.emailForm, ...data },
        })),
      clearEmailForm: () => set({ emailForm: initialEmailForm }),

      // Appointment form
      appointmentForm: initialAppointmentForm,
      setAppointmentForm: (data) =>
        set((state) => ({
          appointmentForm: { ...state.appointmentForm, ...data },
        })),
      clearAppointmentForm: () => set({ appointmentForm: initialAppointmentForm }),

      // Service form
      serviceForm: initialServiceForm,
      setServiceForm: (data) =>
        set((state) => ({
          serviceForm: { ...state.serviceForm, ...data },
        })),
      clearServiceForm: () => set({ serviceForm: initialServiceForm }),

      // Search and filters
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      lastVisitFilter: 'all',
      setLastVisitFilter: (filter) => set({ lastVisitFilter: filter }),

      // Clear all
      clearAllForms: () =>
        set({
          emailForm: initialEmailForm,
          appointmentForm: initialAppointmentForm,
          serviceForm: initialServiceForm,
          searchQuery: '',
          lastVisitFilter: 'all',
        }),
    }),
    {
      name: 'salon-form-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields (exclude sensitive data if needed)
      partialize: (state) => ({
        emailForm: state.emailForm,
        appointmentForm: state.appointmentForm,
        serviceForm: state.serviceForm,
        searchQuery: state.searchQuery,
        lastVisitFilter: state.lastVisitFilter,
      }),
    }
  )
);
