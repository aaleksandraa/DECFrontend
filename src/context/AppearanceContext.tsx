import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { publicSettingsAPI } from '../services/api';

interface GradientSettings {
  preset?: string;
  from: string;
  via?: string;
  to: string;
  direction: string;
  custom?: boolean;
}

// Salon profile layout types
export type SalonProfileLayout = 'classic' | 'classic-desc-first' | 'compact-hero' | 'modern-card' | 'description-first';

interface AppearanceContextType {
  homepageGradient: GradientSettings;
  navbarGradient: GradientSettings;
  heroBackgroundImage: string | null;
  salonProfileLayout: SalonProfileLayout;
  stickyNavbar: boolean;
  getGradientClass: (gradient: GradientSettings) => string;
  getGradientStyle: (gradient: GradientSettings) => React.CSSProperties;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultHomepageGradient: GradientSettings = {
  preset: 'beauty-rose',
  from: '#f43f5e',
  via: '#ec4899',
  to: '#a855f7',
  direction: 'br',
  custom: false
};

const defaultNavbarGradient: GradientSettings = {
  preset: 'sunset-orange',
  from: '#f97316',
  via: '#ea580c',
  to: '#dc2626',
  direction: 'r',
  custom: false
};

const AppearanceContext = createContext<AppearanceContextType>({
  homepageGradient: defaultHomepageGradient,
  navbarGradient: defaultNavbarGradient,
  heroBackgroundImage: null,
  salonProfileLayout: 'classic',
  stickyNavbar: true,
  getGradientClass: () => '',
  getGradientStyle: () => ({}),
  loading: true,
  refreshSettings: async () => {}
});

export const useAppearance = () => useContext(AppearanceContext);

interface AppearanceProviderProps {
  children: ReactNode;
}

export const AppearanceProvider: React.FC<AppearanceProviderProps> = ({ children }) => {
  const [homepageGradient, setHomepageGradient] = useState<GradientSettings>(defaultHomepageGradient);
  const [navbarGradient, setNavbarGradient] = useState<GradientSettings>(defaultNavbarGradient);
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<string | null>(null);
  const [salonProfileLayout, setSalonProfileLayout] = useState<SalonProfileLayout>('classic');
  const [stickyNavbar, setStickyNavbar] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await publicSettingsAPI.getAppearanceSettings();
      if (response.gradient) {
        setHomepageGradient(response.gradient);
      }
      if (response.navbar_gradient) {
        setNavbarGradient(response.navbar_gradient);
      }
      if (response.hero_background_image !== undefined) {
        setHeroBackgroundImage(response.hero_background_image);
      }
      if (response.salon_profile_layout) {
        setSalonProfileLayout(response.salon_profile_layout);
      }
      if (response.sticky_navbar !== undefined) {
        setStickyNavbar(response.sticky_navbar);
      }
    } catch (error) {
      console.error('Error fetching appearance settings:', error);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getDirectionClass = (direction: string): string => {
    const directionMap: Record<string, string> = {
      'r': 'to-r',
      'l': 'to-l',
      't': 'to-t',
      'b': 'to-b',
      'tr': 'to-tr',
      'tl': 'to-tl',
      'br': 'to-br',
      'bl': 'to-bl'
    };
    return directionMap[direction] || 'to-r';
  };

  const getGradientClass = (gradient: GradientSettings): string => {
    // For Tailwind preset gradients
    const presetClasses: Record<string, string> = {
      'sunset-orange': 'from-orange-500 via-orange-600 to-red-500',
      'orange-red': 'from-orange-400 via-red-500 to-red-600',
      'beauty-rose': 'from-rose-500 via-pink-500 to-purple-500',
      'ocean-blue': 'from-blue-500 via-cyan-500 to-teal-500',
      'forest-green': 'from-green-500 via-emerald-500 to-teal-500',
      'royal-purple': 'from-purple-500 via-violet-500 to-indigo-500',
      'golden-hour': 'from-yellow-400 via-orange-500 to-red-500',
      'midnight': 'from-gray-900 via-purple-900 to-gray-900',
    };

    if (!gradient.custom && gradient.preset && presetClasses[gradient.preset]) {
      return `bg-gradient-${getDirectionClass(gradient.direction)} ${presetClasses[gradient.preset]}`;
    }

    // Custom gradient needs inline style
    return '';
  };

  const getGradientStyle = (gradient: GradientSettings): React.CSSProperties => {
    if (!gradient.custom && gradient.preset) {
      // Use Tailwind classes
      return {};
    }

    // Custom gradient with inline styles
    const directionMap: Record<string, string> = {
      'r': 'to right',
      'l': 'to left',
      't': 'to top',
      'b': 'to bottom',
      'tr': 'to top right',
      'tl': 'to top left',
      'br': 'to bottom right',
      'bl': 'to bottom left'
    };

    const direction = directionMap[gradient.direction] || 'to right';
    const viaColor = gradient.via ? `, ${gradient.via}` : '';
    
    return {
      background: `linear-gradient(${direction}, ${gradient.from}${viaColor}, ${gradient.to})`
    };
  };

  return (
    <AppearanceContext.Provider value={{
      homepageGradient,
      navbarGradient,
      heroBackgroundImage,
      salonProfileLayout,
      stickyNavbar,
      getGradientClass,
      getGradientStyle,
      loading,
      refreshSettings: fetchSettings
    }}>
      {children}
    </AppearanceContext.Provider>
  );
};
