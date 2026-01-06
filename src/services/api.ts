import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

axios.defaults.withCredentials = true; // 🔐 Za session cookies
axios.defaults.baseURL = API_BASE_URL;

// Dedicated axios instance for Sanctum CSRF cookie
const sanctumApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/session
});

// Add request interceptor to ensure CSRF token is fresh
api.interceptors.request.use(
  async (config) => {
    // For state-changing requests, ensure we have a fresh CSRF token
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      // Check if XSRF-TOKEN cookie exists
      const hasXsrfToken = document.cookie.includes('XSRF-TOKEN');
      if (!hasXsrfToken) {
        try {
          await sanctumApi.get('/sanctum/csrf-cookie');
        } catch (error) {
          console.warn('Failed to get CSRF token:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 419 CSRF token mismatch - refresh and retry
    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get fresh CSRF token
        await sanctumApi.get('/sanctum/csrf-cookie');
        // Retry the original request
        return api(originalRequest);
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError);
        return Promise.reject(error);
      }
    }
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // List of endpoints that should NOT trigger redirect on 401
      const publicEndpoints = [
        '/user',
        '/public/',
        '/sanctum/',
        '/login',
        '/register'
      ];
      
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        originalRequest.url?.includes(endpoint)
      );
      
      // Don't redirect for public endpoints or initial checks
      if (!isPublicEndpoint) {
        // Clear auth data and redirect to login only for protected routes
        localStorage.removeItem('auth_token');
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
        
        // Show user-friendly message
        console.warn('Session expired. Please login again.');
        
        // Redirect to login with return URL
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/') {
          window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
        } else {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden - might be CORS or permission issue
    if (error.response?.status === 403) {
      console.error('Access forbidden. This might be a CORS or permission issue.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getCSRF: async () => {
    await sanctumApi.get('/sanctum/csrf-cookie');
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  
  register: async (userData: any, password: string) => {
    const data = {
      ...userData,
      password,
      password_confirmation: password
    };
    const response = await api.post('/register', data);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },
  
  getUser: async () => {
    const response = await api.get('/user');
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },
  
  changePassword: async (currentPassword: string, password: string) => {
    const response = await api.put('/user/password', {
      current_password: currentPassword,
      password,
      password_confirmation: password
    });
    return response.data;
  },

  resendVerificationEmail: async (email: string) => {
    const response = await api.post('/email/resend', { email });
    return response.data;
  }
};

// Salon API
export const salonAPI = {
  getSalons: async (params: any = {}) => {
    const response = await api.get('/salons', { params });
    const payload = response.data;                           // :contentReference[oaicite:0]{index=0}
    // Laravel ResourceCollection: { data: [ … ], meta: { … }, links: { … } }
    return payload.data ?? payload;
  },

  getSalon: async (id: string) => {
    const response = await api.get(`/salons/${id}`);
    return response.data.data || response.data;
  },
  
  createSalon: async (data: any) => {
    const response = await api.post('/salons', data);
    return response.data;
  },
  
  updateSalon: async (id: string, data: any) => {
    const response = await api.put(`/salons/${id}`, data);
    return response.data;
  },
  
  deleteSalon: async (id: string) => {
    const response = await api.delete(`/salons/${id}`);
    return response.data;
  },
  
  uploadImages: async (id: string, formData: FormData) => {
    const response = await api.post(`/salons/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  deleteImage: async (salonId: string, imageId: string) => {
    const response = await api.delete(`/salons/${salonId}/images/${imageId}`);
    return response.data;
  },
  
  setPrimaryImage: async (salonId: string, imageId: string) => {
    const response = await api.put(`/salons/${salonId}/images/${imageId}/primary`);
    return response.data;
  },
  
  getAvailableSlots: async (salonId: string, staffId: string, date: string, serviceId: string, totalDuration?: number) => {
    const response = await api.get(`/salons/${salonId}/available-slots`, {
      params: { 
        staff_id: staffId, 
        date, 
        service_id: serviceId,
        duration: totalDuration // Pass total duration if multiple services selected
      }
    });
    return response.data;
  },
  
  // NEW: Get available slots for multiple services with different staff members
  getAvailableSlotsForMultipleServices: async (salonId: string, date: string, services: Array<{serviceId: string, staffId: string, duration: number}>) => {
    const response = await api.post(`/salons/${salonId}/available-slots-multi`, {
      date,
      services
    });
    return response.data;
  },
  
  getNearestSalons: async (latitude: number, longitude: number, radius?: number) => {
    const response = await api.get('/salons/nearest', {
      params: { latitude, longitude, radius }
    });
    const payload = response.data;                           // :contentReference[oaicite:1]{index=1}
    return payload.data ?? payload;
  },
};

// Staff API
export const staffAPI = {
  getStaff: async (salonId: string) => {
    const response = await api.get(`/salons/${salonId}/staff`);
    return response.data;
  },
  
  getStaffMember: async (salonId: string, staffId: string) => {
    const response = await api.get(`/salons/${salonId}/staff/${staffId}`);
    return response.data;
  },
  
  createStaff: async (salonId: string, data: any) => {
    const response = await api.post(`/salons/${salonId}/staff`, data);
    return response.data;
  },
  
  updateStaff: async (salonId: string, staffId: string, data: any) => {
    const response = await api.put(`/salons/${salonId}/staff/${staffId}`, data);
    return response.data;
  },
  
  deleteStaff: async (salonId: string, staffId: string) => {
    const response = await api.delete(`/salons/${salonId}/staff/${staffId}`);
    return response.data;
  },
  
  uploadAvatar: async (salonId: string, staffId: string, formData: FormData) => {
    const response = await api.post(`/salons/${salonId}/staff/${staffId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getSchedule: async (salonId: string, staffId: string) => {
    const response = await api.get(`/salons/${salonId}/staff/${staffId}/schedule`);
    return response.data;
  },
  
  getAppointments: async (salonId: string, staffId: string, params = {}) => {
    const response = await api.get(`/salons/${salonId}/staff/${staffId}/appointments`, { params });
    return response.data;
  },

  // Update own settings (for frizeri)
  updateOwnSettings: async (data: {
    auto_confirm?: boolean;
    bio?: string;
    bio_long?: string;
    title?: string;
    years_experience?: number | '';
    languages?: string[];
    specialties?: string[];
    education?: Array<{ school: string; degree: string; year: string }>;
    achievements?: Array<{ title: string; description: string; year: string }>;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    accepts_bookings?: boolean;
    booking_note?: string;
    is_public?: boolean;
  }) => {
    const response = await api.put('/staff/me/settings', data);
    return response.data;
  },

  // Get current staff profile (for frizeri)
  getMyProfile: async () => {
    const response = await api.get('/user');
    return response.data;
  },
  
  reorderStaff: async (salonId: string, data: { staff: { id: number; display_order: number }[] }) => {
    const response = await api.post(`/salons/${salonId}/staff/reorder`, data);
    return response.data;
  }
};

// Service API
export const serviceAPI = {
  getServices: async (salonId: string) => {
    const response = await api.get(`/salons/${salonId}/services`);
    return response.data;
  },
  
  getServicesByCategory: async (salonId: string) => {
    const response = await api.get(`/salons/${salonId}/services/by-category`);
    return response.data;
  },
  
  getService: async (salonId: string, serviceId: string) => {
    const response = await api.get(`/salons/${salonId}/services/${serviceId}`);
    return response.data;
  },
  
  createService: async (salonId: string, data: any) => {
    const response = await api.post(`/salons/${salonId}/services`, data);
    return response.data;
  },
  
  updateService: async (salonId: string, serviceId: string, data: any) => {
    const response = await api.put(`/salons/${salonId}/services/${serviceId}`, data);
    return response.data;
  },
  
  deleteService: async (salonId: string, serviceId: string) => {
    const response = await api.delete(`/salons/${salonId}/services/${serviceId}`);
    return response.data;
  },
  
  reorderServices: async (salonId: string, data: { services: { id: number; display_order: number }[]; category_order?: string[] }) => {
    const response = await api.post(`/salons/${salonId}/services/reorder`, data);
    return response.data;
  }
};

// Appointment API
export const appointmentAPI = {
  getAppointments: async (params: any = {}) => {
    const response = await api.get('/appointments', { params });
    // Laravel ResourceCollections vraćaju objekat { data: [...], meta: {...}, links: {...} }
    const payload = response.data;
    // Vratimo samo niz termina:
    return payload.data ?? payload;
  },
   

   getAppointment: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data.data ?? response.data;
  },
  
  createAppointment: async (data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  
  updateAppointment: async (id: string, data: any) => {
    const response = await api.put(`/appointments/${id}`, data);
    return response.data;
  },
  
  deleteAppointment: async (id: string) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },
  
  cancelAppointment: async (id: string) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },

  getMonthCapacity: async (month: string) => {
    const response = await api.get('/appointments/capacity/month', { params: { month } });
    return response.data;
  }
};

// Dashboard API (optimized with caching)
export const dashboardAPI = {
  getSalonStats: async () => {
    const response = await api.get('/dashboard/salon/stats');
    return response.data;
  },
  
  getTodayAppointments: async () => {
    const response = await api.get('/dashboard/salon/today');
    return response.data;
  },
  
  getSalonAnalytics: async (params?: {
    period?: 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
    staff_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.get('/dashboard/salon/analytics', { params });
    return response.data;
  },
  
  getStaffStats: async () => {
    const response = await api.get('/dashboard/staff/stats');
    return response.data;
  },
  
  clearCache: async () => {
    const response = await api.post('/dashboard/clear-cache');
    return response.data;
  }
};

// Review API
export const reviewAPI = {
  getSalonReviews: async (salonId: string, params = {}) => {
    const response = await api.get(`/salons/${salonId}/reviews`, { params });
    return response.data;
  },
  
  getReview: async (id: string) => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },
  
  createReview: async (data: any) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
  
  updateReview: async (id: string, data: any) => {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },
  
  deleteReview: async (id: string) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },
  
  addResponse: async (id: string, response: string) => {
    const res = await api.post(`/reviews/${id}/response`, { response });
    return res.data;
}
};

// Schedule API
export const scheduleAPI = {
  // Salon breaks
  getSalonBreaks: async (salonId: string) => {
    const response = await api.get(`/salons/${salonId}/breaks`);
    return response.data;
  },
  
  createSalonBreak: async (salonId: string, data: any) => {
    const response = await api.post(`/salons/${salonId}/breaks`, data);
    return response.data;
  },
  
  updateSalonBreak: async (salonId: string, breakId: string, data: any) => {
    const response = await api.put(`/salons/${salonId}/breaks/${breakId}`, data);
    return response.data;
  },
  
  deleteSalonBreak: async (salonId: string, breakId: string) => {
    const response = await api.delete(`/salons/${salonId}/breaks/${breakId}`);
    return response.data;
  },
  
  // Salon vacations
  getSalonVacations: async (salonId: string) => {
    const response = await api.get(`/salons/${salonId}/vacations`);
    return response.data;
  },
  
  createSalonVacation: async (salonId: string, data: any) => {
    const response = await api.post(`/salons/${salonId}/vacations`, data);
    return response.data;
  },
  
  updateSalonVacation: async (salonId: string, vacationId: string, data: any) => {
    const response = await api.put(`/salons/${salonId}/vacations/${vacationId}`, data);
    return response.data;
  },
  
  deleteSalonVacation: async (salonId: string, vacationId: string) => {
    const response = await api.delete(`/salons/${salonId}/vacations/${vacationId}`);
    return response.data;
  },
  
  // Staff breaks
  getStaffBreaks: async (staffId: string) => {
    const response = await api.get(`/staff/${staffId}/breaks`);
    return response.data;
  },
  
  createStaffBreak: async (staffId: string, data: any) => {
    const response = await api.post(`/staff/${staffId}/breaks`, data);
    return response.data;
  },
  
  updateStaffBreak: async (staffId: string, breakId: string, data: any) => {
    const response = await api.put(`/staff/${staffId}/breaks/${breakId}`, data);
    return response.data;
  },
  
  deleteStaffBreak: async (staffId: string, breakId: string) => {
    const response = await api.delete(`/staff/${staffId}/breaks/${breakId}`);
    return response.data;
  },
  
  // Staff vacations
  getStaffVacations: async (staffId: string) => {
    const response = await api.get(`/staff/${staffId}/vacations`);
    return response.data;
  },
  
  createStaffVacation: async (staffId: string, data: any) => {
    const response = await api.post(`/staff/${staffId}/vacations`, data);
    return response.data;
  },
  
  updateStaffVacation: async (staffId: string, vacationId: string, data: any) => {
    const response = await api.put(`/staff/${staffId}/vacations/${vacationId}`, data);
    return response.data;
  },
  
  deleteStaffVacation: async (staffId: string, vacationId: string) => {
    const response = await api.delete(`/staff/${staffId}/vacations/${vacationId}`);
    return response.data;
  }
};

// Favorite API
export const favoriteAPI = {
  getFavorites: async () => {
    const response = await api.get('/favorites');
    const payload = response.data;
    return payload.data ?? payload;
  },
  
  addFavorite: async (salonId: string) => {
    const response = await api.post(`/favorites/${salonId}`);
    return response.data;
  },
  
  removeFavorite: async (salonId: string) => {
    const response = await api.delete(`/favorites/${salonId}`);
    return response.data;
  },
  
  checkFavorite: async (salonId: string) => {
    const response = await api.get(`/favorites/${salonId}/check`);
    return response.data;
  }
};

// =============================================
// PUBLIC API - No authentication required
// =============================================
export const publicAPI = {
  // Get all cities with salon counts
  getCities: async () => {
    const response = await api.get('/public/cities');
    return response.data;
  },

  // Get salons for a specific city
  getSalonsByCity: async (citySlug: string) => {
    const response = await api.get(`/public/cities/${citySlug}`);
    return response.data;
  },

  // Get salon by slug (SEO-friendly)
  getSalonBySlug: async (slug: string) => {
    const response = await api.get(`/public/salon/${slug}`);
    return response.data;
  },

  // Public search
  search: async (params: {
    q?: string;
    city?: string;
    service?: string;
    min_rating?: number;
    audience?: string[];
    sort?: string;
    direction?: 'asc' | 'desc';
    per_page?: number;
    date?: string;
    time?: string;
    duration?: number;
  }) => {
    const response = await api.get('/public/search', { params });
    return response.data;
  },

  // Alias for search
  searchSalons: async (params: {
    q?: string;
    city?: string;
    service?: string;
    min_rating?: number;
    audience?: string[];
    sort?: string;
    direction?: 'asc' | 'desc';
    per_page?: number;
    date?: string;
    time?: string;
    duration?: number;
  }) => {
    const response = await api.get('/public/search', { params });
    return response.data;
  },

  // Get popular services for search suggestions
  getPopularServices: async () => {
    const response = await api.get('/public/services');
    return response.data;
  },

  // Get available time slots (public)
  getAvailableSlots: async (staffId: string, serviceId: string, date: string) => {
    const response = await api.get('/public/available-slots', {
      params: { staff_id: staffId, service_id: serviceId, date }
    });
    return response.data;
  },

  // Get available time slots for multiple services (public)
  getAvailableSlotsForMultipleServices: async (salonId: string, date: string, services: Array<{serviceId: string, staffId: string, duration: number}>) => {
    const response = await api.post(`/public/available-slots-multi`, {
      salon_id: salonId,
      date,
      services
    });
    return response.data;
  },

  // Book as guest
  bookAsGuest: async (data: {
    salon_id: number;
    staff_id: number;
    service_id: number;
    date: string;
    time: string;
    notes?: string;
    guest_name: string;
    guest_email?: string;
    guest_phone: string;
    guest_address: string;
  }) => {
    const response = await api.post('/public/book', data);
    return response.data;
  },

  // Get sitemap data
  getSitemap: async () => {
    const response = await api.get('/public/sitemap');
    return response.data;
  },

  // Contact form
  sendContactForm: async (data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }) => {
    const response = await api.post('/public/contact', data);
    return response.data;
  },

  // Get month capacity (public - for guest booking)
  getMonthCapacity: async (salonId: string, month: string) => {
    const response = await api.get(`/public/salons/${salonId}/capacity/month`, { params: { month } });
    return response.data;
  },

  // Get available dates for a month (single API call - optimized)
  getAvailableDatesForMonth: async (salonId: string, params: {
    staff_id: number;
    month: string; // YYYY-MM format
    services: Array<{ serviceId: string; staffId: string; duration: number }>;
  }) => {
    const response = await api.post('/public/available-dates-month', {
      salon_id: salonId,
      staff_id: params.staff_id,
      month: params.month,
      services: params.services
    });
    return response.data;
  },

  // Download ICS calendar file (public - no auth required)
  downloadIcs: async (appointmentId: number) => {
    const response = await api.get(`/public/appointments/${appointmentId}/ics`, {
      responseType: 'blob',
    });
    return response.data;
  }
};

// Notification API
export const notificationAPI = {
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  // Generic methods for direct API access
  get: async (url: string, config?: any) => {
    return await api.get(url, config);
  },
  
  post: async (url: string, data?: any, config?: any) => {
    return await api.post(url, data, config);
  },
  
  put: async (url: string, data?: any, config?: any) => {
    return await api.put(url, data, config);
  },
  
  delete: async (url: string, config?: any) => {
    return await api.delete(url, config);
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (data: any) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  resetUserPassword: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return response.data;
  },

  sendMessageToUser: async (id: string, message: string) => {
    const response = await api.post(`/admin/users/${id}/message`, { message });
    return response.data;
  },
  
  getSalons: async (params = {}) => {
    const response = await api.get('/admin/salons', { params });
    return response.data;
  },

  updateSalon: async (id: string, data: any) => {
    const response = await api.put(`/admin/salons/${id}`, data);
    return response.data;
  },
  
  approveSalon: async (id: string) => {
    const response = await api.put(`/admin/salons/${id}/approve`);
    return response.data;
  },
  
  suspendSalon: async (id: string) => {
    const response = await api.put(`/admin/salons/${id}/suspend`);
    return response.data;
  },
  
  getAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analytics', { params });
    return response.data;
  },
  
  // System settings
  getSettings: async (group?: string) => {
    const url = group ? `/admin/settings/${group}` : '/admin/settings';
    const response = await api.get(url);
    return response;
  },
  
  updateSettings: async (settings: Array<{ key: string; value: any }>) => {
    const response = await api.put('/admin/settings', { settings });
    return response;
  },
  
  // Gradient/Appearance settings
  getGradientPresets: async () => {
    const response = await api.get('/admin/gradient-presets');
    return response.data;
  },
  
  updateGradient: async (gradient: {
    preset?: string;
    from: string;
    via?: string;
    to: string;
    direction: string;
    custom?: boolean;
  }) => {
    const response = await api.put('/admin/gradient', gradient);
    return response.data;
  },

  updateNavbarGradient: async (gradient: {
    preset?: string;
    from: string;
    via?: string;
    to: string;
    direction: string;
    custom?: boolean;
  }) => {
    const response = await api.put('/admin/navbar-gradient', gradient);
    return response.data;
  },

  getAppearanceSettings: async () => {
    const response = await api.get('/public/appearance-settings');
    return response.data;
  },

  updateStickyNavbar: async (sticky: boolean) => {
    const response = await api.put('/admin/sticky-navbar', { sticky });
    return response.data;
  },

  updateSearchVersion: async (version: 'v1' | 'v2') => {
    const response = await api.put('/admin/search-version', { version });
    return response.data;
  },

  // Salon Profile Layout settings
  getSalonProfileLayout: async () => {
    const response = await api.get('/admin/salon-profile-layout');
    return response.data;
  },

  updateSalonProfileLayout: async (layout: string) => {
    const response = await api.put('/admin/salon-profile-layout', { layout });
    return response.data;
  },

  // Featured Salon settings
  getFeaturedSalon: async () => {
    const response = await api.get('/admin/featured-salon');
    return response.data;
  },

  updateFeaturedSalon: async (data: { salon_id?: number | null; text?: string; visibility?: 'all' | 'location_only'; show_top_rated?: boolean; show_newest?: boolean }) => {
    const response = await api.put('/admin/featured-salon', data);
    return response.data;
  },

  updateAnalyticsSettings: async (data: { google_analytics_id: string; google_analytics_enabled: boolean }) => {
    const response = await api.put('/admin/analytics-settings', data);
    return response.data;
  }
};

// Public settings API (for GA injection, appearance, etc.)
export const publicSettingsAPI = {
  getAnalyticsSettings: async () => {
    const response = await api.get('/public/analytics-settings');
    return response.data;
  },
  
  getAppearanceSettings: async () => {
    const response = await api.get('/public/appearance-settings');
    return response.data;
  },
  
  getFeaturedSalon: async () => {
    const response = await api.get('/public/featured-salon');
    return response.data;
  },

  getRegistrationSettings: async () => {
    const response = await api.get('/public/registration-settings');
    return response.data;
  }
};

// Admin settings API
export const adminSettingsAPI = {
  getRegistrationSettings: async () => {
    const response = await api.get('/admin/registration-settings');
    return response.data;
  },

  updateRegistrationSettings: async (data: { allow_frizer_registration: boolean }) => {
    const response = await api.put('/admin/registration-settings', data);
    return response.data;
  }
};

// Locations API
export const locationsAPI = {
  // Get all active locations (for dropdowns)
  getAll: async (params?: { search?: string; entity?: string; canton?: string }) => {
    const response = await api.get('/public/locations', { params });
    return response.data;
  },
  
  // Get locations grouped by entity/canton (for organized dropdown)
  getGrouped: async () => {
    const response = await api.get('/public/locations/grouped');
    return response.data;
  },
  
  // Get all cantons (FBiH) and regions (RS)
  getCantons: async () => {
    const response = await api.get('/public/locations/cantons');
    return response.data;
  },
  
  // Admin: Get all locations with pagination
  adminGetAll: async (params?: { page?: number; per_page?: number; search?: string }) => {
    const response = await api.get('/admin/locations', { params });
    return response.data;
  },
  
  // Admin: Create new location
  create: async (data: {
    name: string;
    postal_code?: string;
    entity: 'FBiH' | 'RS' | 'BD';
    canton?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    population?: number;
  }) => {
    const response = await api.post('/admin/locations', data);
    return response.data;
  },
  
  // Admin: Get single location
  get: async (id: number) => {
    const response = await api.get(`/admin/locations/${id}`);
    return response.data;
  },
  
  // Admin: Update location
  update: async (id: number, data: {
    name?: string;
    postal_code?: string;
    entity?: 'FBiH' | 'RS' | 'BD';
    canton?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    population?: number;
    is_active?: boolean;
  }) => {
    const response = await api.put(`/admin/locations/${id}`, data);
    return response.data;
  },
  
  // Admin: Delete location
  delete: async (id: number) => {
    const response = await api.delete(`/admin/locations/${id}`);
    return response.data;
  }
};

// Job Ads API
export const jobAdsAPI = {
  // Public: Get all active job ads
  getAll: async (params?: { 
    page?: number; 
    per_page?: number; 
    q?: string; 
    city?: string; 
    gender?: string 
  }) => {
    const response = await api.get('/public/job-ads', { params });
    return response.data;
  },
  
  // Public: Get single job ad
  get: async (id: number) => {
    const response = await api.get(`/public/job-ads/${id}`);
    return response.data;
  },
  
  // Admin: Get all job ads
  adminGetAll: async (params?: { 
    page?: number; 
    per_page?: number; 
    status?: string 
  }) => {
    const response = await api.get('/admin/job-ads', { params });
    return response.data;
  },
  
  // Admin: Create job ad
  create: async (data: {
    company_name: string;
    position_title: string;
    description: string;
    gender_requirement: 'male' | 'female' | 'any';
    contact_email: string;
    contact_phone?: string;
    city?: string;
    deadline?: string;
    salon_id?: number;
    is_active?: boolean;
  }) => {
    const response = await api.post('/admin/job-ads', data);
    return response.data;
  },
  
  // Admin: Update job ad
  update: async (id: number, data: Partial<{
    company_name: string;
    position_title: string;
    description: string;
    gender_requirement: 'male' | 'female' | 'any';
    contact_email: string;
    contact_phone?: string;
    city?: string;
    deadline?: string;
    salon_id?: number;
    is_active?: boolean;
  }>) => {
    const response = await api.put(`/admin/job-ads/${id}`, data);
    return response.data;
  },
  
  // Admin: Delete job ad
  delete: async (id: number) => {
    const response = await api.delete(`/admin/job-ads/${id}`);
    return response.data;
  },
  
  // Admin: Toggle active status
  toggleActive: async (id: number) => {
    const response = await api.put(`/admin/job-ads/${id}/toggle-active`);
    return response.data;
  },
  
  // Admin: Update owner posting setting
  updateOwnerPostingSetting: async (allow: boolean) => {
    const response = await api.put('/admin/job-ads/owner-posting-setting', {
      allow_owner_posting: allow
    });
    return response.data;
  },
  
  // Owner: Get my job ads
  ownerGetAll: async () => {
    const response = await api.get('/owner/job-ads');
    return response.data;
  },
  
  // Owner: Create job ad
  ownerCreate: async (data: {
    position_title: string;
    description: string;
    gender_requirement: 'male' | 'female' | 'any';
    contact_email?: string;
    contact_phone?: string;
    deadline?: string;
  }) => {
    const response = await api.post('/owner/job-ads', data);
    return response.data;
  },
  
  // Owner: Update job ad
  ownerUpdate: async (id: number, data: Partial<{
    position_title: string;
    description: string;
    gender_requirement: 'male' | 'female' | 'any';
    contact_email?: string;
    contact_phone?: string;
    deadline?: string;
    is_active?: boolean;
  }>) => {
    const response = await api.put(`/owner/job-ads/${id}`, data);
    return response.data;
  },
  
  // Owner: Delete job ad
  ownerDelete: async (id: number) => {
    const response = await api.delete(`/owner/job-ads/${id}`);
    return response.data;
  }
};

// Widget API
export const widgetAPI = {
  // Admin: Get all widget settings
  getAllSettings: async () => {
    const response = await api.get('/admin/widget');
    return response.data;
  },
  
  // Admin: Get widget settings for a salon
  getSettings: async (salonId: string) => {
    const response = await api.get(`/admin/widget/${salonId}`);
    return response.data;
  },
  
  // Admin: Generate or regenerate API key
  generateKey: async (salonId: string) => {
    const response = await api.post(`/admin/widget/${salonId}/generate`);
    return response.data;
  },
  
  // Admin: Update widget settings
  updateSettings: async (salonId: string, data: {
    is_active?: boolean;
    allowed_domains?: string[];
    primary_color?: string;
    button_text?: string;
  }) => {
    const response = await api.put(`/admin/widget/${salonId}/settings`, data);
    return response.data;
  },
  
  // Admin: Delete widget settings
  deleteSettings: async (salonId: string) => {
    const response = await api.delete(`/admin/widget/${salonId}`);
    return response.data;
  },
  
  // Admin: Get widget analytics
  getAnalytics: async (salonId: string, params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.get(`/admin/widget/${salonId}/analytics`, { params });
    return response.data;
  },
  
  // Public: Get salon widget data (used by widget iframe)
  getSalonWidget: async (salonSlug: string, apiKey: string) => {
    const response = await api.get(`/widget/${salonSlug}`, {
      headers: {
        'X-Widget-Key': apiKey
      }
    });
    return response.data;
  },
  
  // Public: Get available slots for widget booking (multi-service support)
  getAvailableSlots: async (apiKey: string, params: {
    staff_id: number;
    date: string;
    services: Array<{ serviceId: string; duration: number }>;
  }) => {
    const response = await api.get('/widget/slots/available', {
      params: {
        key: apiKey,
        staff_id: params.staff_id,
        date: params.date,
        services: params.services
      }
    });
    return response.data;
  },
  
  // Public: Book appointment via widget (multi-service support)
  book: async (apiKey: string, data: {
    salon_id: number;
    staff_id: number;
    services: Array<{ id: string }>;
    date: string;
    time: string;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    guest_address: string;
    notes?: string;
  }) => {
    const response = await api.post('/widget/book', {
      ...data,
      api_key: apiKey
    });
    return response.data;
  },

  // Public: Get available dates for a month (single API call instead of multiple)
  getAvailableDates: async (apiKey: string, params: {
    staff_id: number;
    month: string; // YYYY-MM format
    services: Array<{ serviceId: string; duration: number }>;
  }) => {
    const response = await api.post('/widget/dates/available', {
      api_key: apiKey,
      staff_id: params.staff_id,
      month: params.month,
      services: params.services
    });
    return response.data;
  }
};

// Client API
export const clientAPI = {
  // Get all clients for a salon
  getClients: async (params?: { search?: string; page?: number; per_page?: number }) => {
    const response = await api.get('/clients', { params });
    return response.data;
  },
  
  // Get single client
  getClient: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  
  // Send email to client
  sendEmail: async (id: string, data: { subject: string; message: string }) => {
    const response = await api.post(`/clients/${id}/send-email`, data);
    return response.data;
  }
};

// Salon Settings API (daily reports, etc.)
export const salonSettingsAPI = {
  // Get salon settings
  getSettings: async () => {
    const response = await api.get('/salon/settings');
    return response.data;
  },
  
  // Update salon settings
  updateSettings: async (data: {
    daily_report_enabled?: boolean;
    daily_report_time?: string;
    daily_report_email?: string;
    daily_report_include_staff?: boolean;
    daily_report_include_services?: boolean;
    daily_report_include_capacity?: boolean;
    daily_report_include_cancellations?: boolean;
  }) => {
    const response = await api.put('/salon/settings', data);
    return response.data;
  },
  
  // Send test report
  sendTestReport: async () => {
    const response = await api.post('/salon/settings/test-report');
    return response.data;
  },
  
  // Preview report data
  previewReport: async () => {
    const response = await api.get('/salon/settings/preview-report');
    return response.data;
  }
};

// Homepage Categories API
export const homepageCategoriesAPI = {
  // Public - Get enabled categories
  getPublic: async () => {
    const response = await api.get('/public/homepage-categories');
    return response.data;
  },
  
  // Admin - Get all categories with settings
  getAll: async () => {
    const response = await api.get('/admin/homepage-categories');
    return response.data;
  },
  
  // Admin - Create new category
  create: async (data: {
    name: string;
    title: string;
    description?: string;
    link_type: 'search' | 'url' | 'category';
    link_value: string;
    is_enabled?: boolean;
  }) => {
    const response = await api.post('/admin/homepage-categories', data);
    return response.data;
  },
  
  // Admin - Update category
  update: async (id: number, data: {
    name?: string;
    title?: string;
    description?: string;
    link_type?: 'search' | 'url' | 'category';
    link_value?: string;
    is_enabled?: boolean;
  }) => {
    const response = await api.put(`/admin/homepage-categories/${id}`, data);
    return response.data;
  },
  
  // Admin - Delete category
  delete: async (id: number) => {
    const response = await api.delete(`/admin/homepage-categories/${id}`);
    return response.data;
  },
  
  // Admin - Upload category image
  uploadImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(`/admin/homepage-categories/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  // Admin - Reorder categories
  reorder: async (categories: Array<{ id: number; display_order: number }>) => {
    const response = await api.post('/admin/homepage-categories/reorder', { categories });
    return response.data;
  },
  
  // Admin - Update global settings
  updateSettings: async (settings: {
    enabled: boolean;
    mobile: boolean;
    desktop: boolean;
    layout: 'grid' | 'carousel';
  }) => {
    const response = await api.put('/admin/homepage-categories/settings', settings);
    return response.data;
  }
};

export default api;
