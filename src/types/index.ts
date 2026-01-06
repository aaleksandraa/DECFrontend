export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  city?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'admin' | 'salon' | 'frizer' | 'klijent';
  avatar?: string;
  salon?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    status?: 'pending' | 'approved' | 'suspended';
  };
  staff_profile?: {
    id: string;
    name: string;
    slug?: string;
    role: string;
    salon_id: string;
    auto_confirm: boolean;
    avatar_url?: string;
    bio?: string;
    bio_long?: string;
    title?: string;
    years_experience?: number;
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
  };
  created_at: string;
  updated_at: string;
}

export interface Salon {
  id: string;
  name: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  description: string;
  address: string;
  city: string;
  city_slug?: string;
  postal_code?: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  target_audience?: {
    women: boolean;
    men: boolean;
    children: boolean;
  };
  images: SalonImage[];
  rating: number;
  review_count: number;
  working_hours: {
    [key: string]: { open: string; close: string; is_open: boolean };
  };
  owner_id: string;
  owner?: User;
  location: {
    lat: number;
    lng: number;
    googlePlaceId?: string;
  };
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url?: string | null;
  amenities: string[];
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
  };
  is_verified: boolean;
  auto_confirm?: boolean;
  show_service_gallery?: boolean;
  category_order?: string[];
  status: 'pending' | 'approved' | 'suspended';
  salon_breaks?: Break[];
  salon_vacations?: Vacation[];
  services?: Service[];
  staff?: Staff[];
  reviews?: Review[];
  created_at: string;
  updated_at: string;
}

export interface SalonImage {
  id: string;
  url: string;
  is_primary: boolean;
  order: number;
}

export type StaffRole = 'frizer' | 'kozmeticar' | 'stilista' | 'masazer' | 'manikir' | 'pedikir' | 'other';

export const StaffRoleLabels: Record<StaffRole, string> = {
  frizer: 'Frizer/ka',
  kozmeticar: 'Kozmetičar/ka',
  stilista: 'Stilista',
  masazer: 'Maser/ka',
  manikir: 'Manikir',
  pedikir: 'Pedikir',
  other: 'Ostalo',
};

export interface Staff {
  id: string;
  user_id?: string;
  name: string;
  role: StaffRole | string;
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  specialties: string[];
  working_hours: {
    [key: string]: { start: string; end: string; is_working: boolean };
  };
  breaks?: Break[];
  vacations?: Vacation[];
  rating: number;
  review_count: number;
  display_order?: number;
  salon_id: string;
  services?: Service[];
  staff_ids?: string[];
  is_active: boolean;
  auto_confirm?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Break {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'specific_date' | 'date_range';
  start_time: string;
  end_time: string;
  days?: string[]; // for weekly breaks
  date?: string; // for specific date
  start_date?: string; // for date range
  end_date?: string; // for date range
  is_active: boolean;
  created_at: string;
}

export interface Vacation {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: 'vacation' | 'sick_leave' | 'personal' | 'other';
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  discount_price?: number | null;
  category: string;
  display_order?: number;
  salon_id: string;
  staff_ids: string[];
  staff?: Staff[];
  is_active: boolean;
  images?: Array<{
    id: number;
    image_url: string;
    title?: string;
    description?: string;
    is_featured: boolean;
    order: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  is_guest?: boolean;
  guest_address?: string;
  salon_id: string;
  staff_id: string;
  service_id: string | null; // Can be null for multi-service appointments
  service_ids?: number[]; // For multi-service appointments
  is_multi_service?: boolean;
  service_name?: string; // Service name(s) from backend
  services?: Service[]; // All services for this appointment
  salon?: Salon;
  staff?: Staff;
  service?: Service; // Single service (for backward compatibility)
  date: string; // DD.MM.YYYY format
  time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'in_progress';
  notes?: string;
  total_price: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  review?: Review;
  can_be_cancelled?: boolean;
  can_be_rescheduled?: boolean;
  can_be_reviewed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  client_id: string;
  client_name: string;
  salon_id: string;
  staff_id?: string;
  appointment_id: string;
  rating: number;
  comment: string;
  date: string; // DD.MM.YYYY format
  response?: {
    text: string;
    date: string;
    respondedBy: string;
  };
  is_verified: boolean;
  salon?: Salon;
  staff?: Staff;
  client?: User;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (userData: Partial<User>, password: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  ensureAuthenticated: () => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export interface SalonFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  postal_code?: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  target_audience?: {
    women: boolean;
    men: boolean;
    children: boolean;
  };
  location: {
    lat: number;
    lng: number;
    googlePlaceId?: string;
  };
  working_hours: {
    [key: string]: { open: string; close: string; is_open: boolean };
  };
  amenities: string[];
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    linkedin?: string;
  };
}

export interface LocationSearchResult {
  placeId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  recipient_id: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
  created_at_diff: string;
}

// Predefined location from database
export interface Location {
  id: number;
  name: string;
  city_slug: string;
  postal_code: string | null;
  entity: 'FBiH' | 'RS' | 'BD';
  canton: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  is_active: boolean;
}

// Grouped locations response
export interface GroupedLocations {
  FBiH: {
    [canton: string]: Location[];
  };
  RS: {
    [region: string]: Location[];
  };
  BD: Location[];
}