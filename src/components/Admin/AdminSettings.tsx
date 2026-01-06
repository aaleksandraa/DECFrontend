import { useState, useEffect } from 'react';
import { Save, User, Lock, Bell, Shield, Eye, EyeOff, BarChart3, Globe, CheckCircle, XCircle, Palette, Image, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, adminAPI, adminSettingsAPI, publicSettingsAPI } from '../../services/api';

interface GradientPreset {
  id: string;
  name: string;
  from: string;
  via?: string;
  to: string;
  direction: string;
}

interface GradientSettings {
  preset?: string;
  from: string;
  via?: string;
  to: string;
  direction: string;
  custom?: boolean;
}

export function AdminSettings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Analytics settings
  const [analyticsData, setAnalyticsData] = useState({
    google_analytics_id: '',
    google_analytics_enabled: false,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Gradient/Appearance settings
  const [gradientPresets, setGradientPresets] = useState<GradientPreset[]>([]);
  const [currentGradient, setCurrentGradient] = useState<GradientSettings>({
    preset: 'beauty-rose',
    from: '#f43f5e',
    via: '#ec4899',
    to: '#a855f7',
    direction: 'br',
    custom: false
  });
  const [gradientLoading, setGradientLoading] = useState(false);
  const [useCustomGradient, setUseCustomGradient] = useState(false);
  
  // Salon profile layout settings
  const [salonProfileLayout, setSalonProfileLayout] = useState<string>('classic');
  const [layoutLoading, setLayoutLoading] = useState(false);
  
  // Hero background image
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<string>('');

  // Sticky navbar setting
  const [stickyNavbar, setStickyNavbar] = useState<boolean>(true);

  // Featured salon settings
  const [featuredSalonId, setFeaturedSalonId] = useState<number | null>(null);
  const [featuredSalonText, setFeaturedSalonText] = useState<string>('Otvoren je novi salon u vašem gradu');
  const [featuredSalonVisibility, setFeaturedSalonVisibility] = useState<'all' | 'location_only'>('all');
  const [showTopRated, setShowTopRated] = useState(true);
  const [showNewest, setShowNewest] = useState(true);
  const [allSalons, setAllSalons] = useState<Array<{ id: number; name: string; city: string }>>([]);
  const [salonSearchQuery, setSalonSearchQuery] = useState('');
  const [salonSearchResults, setSalonSearchResults] = useState<Array<{ id: number; name: string; city: string }>>([]);
  const [showSalonDropdown, setShowSalonDropdown] = useState(false);

  // Registration settings
  const [allowFrizerRegistration, setAllowFrizerRegistration] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  // Search version setting
  const [searchVersion, setSearchVersion] = useState<'v1' | 'v2'>('v1');
  const [searchVersionLoading, setSearchVersionLoading] = useState(true);
  
  // Load analytics settings on mount
  useEffect(() => {
    const loadAnalyticsSettings = async () => {
      try {
        // Use public endpoint which returns simpler format
        const settings = await publicSettingsAPI.getAnalyticsSettings();
        setAnalyticsData({
          google_analytics_id: settings.google_analytics_id || '',
          google_analytics_enabled: settings.google_analytics_enabled || false,
        });
      } catch (error) {
        console.error('Failed to load analytics settings:', error);
      }
    };
    
    loadAnalyticsSettings();
  }, []);

  // Load gradient settings on mount
  useEffect(() => {
    const loadGradientSettings = async () => {
      try {
        const response = await adminAPI.getGradientPresets();
        if (response.presets) {
          setGradientPresets(response.presets);
        }
        if (response.current) {
          setCurrentGradient(response.current);
          setUseCustomGradient(response.current.custom || false);
        }
        if (response.hero_background_image) {
          setHeroBackgroundImage(response.hero_background_image);
        }
        // Load sticky navbar setting from appearance settings
        const appearanceResponse = await adminAPI.getAppearanceSettings();
        if (appearanceResponse.sticky_navbar !== undefined) {
          setStickyNavbar(appearanceResponse.sticky_navbar);
        }
        // Load search version setting
        if (appearanceResponse.search_version) {
          setSearchVersion(appearanceResponse.search_version);
        }
        setSearchVersionLoading(false);
      } catch (error) {
        console.error('Failed to load gradient settings:', error);
      }
    };
    
    loadGradientSettings();
  }, []);

  // Load salon profile layout
  useEffect(() => {
    const loadLayoutSettings = async () => {
      try {
        const response = await adminAPI.getSalonProfileLayout();
        if (response.layout) {
          setSalonProfileLayout(response.layout);
        }
      } catch (error) {
        console.error('Failed to load layout settings:', error);
      }
    };
    
    loadLayoutSettings();
  }, []);

  // Load featured salon settings
  useEffect(() => {
    const loadFeaturedSalon = async () => {
      try {
        const response = await adminAPI.getFeaturedSalon();
        if (response.featured_salon_id) {
          setFeaturedSalonId(response.featured_salon_id);
        }
        if (response.featured_salon_text) {
          setFeaturedSalonText(response.featured_salon_text);
        }
        if (response.featured_salon_visibility) {
          setFeaturedSalonVisibility(response.featured_salon_visibility);
        }
        if (response.show_top_rated !== undefined) {
          setShowTopRated(response.show_top_rated);
        }
        if (response.show_newest !== undefined) {
          setShowNewest(response.show_newest);
        }
        if (response.salon) {
          setSalonSearchQuery(response.salon.name);
        }
      } catch (error) {
        console.error('Failed to load featured salon settings:', error);
      }
    };
    
    loadFeaturedSalon();
  }, []);

  // Load registration settings
  useEffect(() => {
    const loadRegistrationSettings = async () => {
      try {
        const response = await adminSettingsAPI.getRegistrationSettings();
        setAllowFrizerRegistration(response.allow_frizer_registration || false);
      } catch (error) {
        console.error('Failed to load registration settings:', error);
      }
    };
    loadRegistrationSettings();
  }, []);

  // Search salons for featured salon dropdown
  useEffect(() => {
    if (!salonSearchQuery || salonSearchQuery.length < 2) {
      setSalonSearchResults([]);
      return;
    }
    
    const searchSalons = async () => {
      try {
        const { publicAPI } = await import('../../services/api');
        const response = await publicAPI.search({ q: salonSearchQuery, per_page: 10 } as any);
        const salons = response.salons || response.data || [];
        setSalonSearchResults(salons.map((s: { id: number; name: string; city?: string }) => ({ 
          id: s.id, 
          name: s.name, 
          city: s.city || '' 
        })));
      } catch (error) {
        console.error('Failed to search salons:', error);
      }
    };
    
    const debounce = setTimeout(searchSalons, 300);
    return () => clearTimeout(debounce);
  }, [salonSearchQuery]);

  const handleLayoutSelect = (layout: string) => {
    setSalonProfileLayout(layout);
  };

  const handleSelectFeaturedSalon = (salon: { id: number; name: string; city: string }) => {
    setFeaturedSalonId(salon.id);
    setSalonSearchQuery(salon.name);
    setShowSalonDropdown(false);
  };

  const handleClearFeaturedSalon = () => {
    setFeaturedSalonId(null);
    setSalonSearchQuery('');
  };

  const handleAppearanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGradientLoading(true);
    setMessage(null);
    
    try {
      // Save gradient settings
      await adminAPI.updateGradient({
        ...currentGradient,
        custom: useCustomGradient,
        background_image: heroBackgroundImage || null,
      } as any);
      
      // Save layout settings
      await adminAPI.updateSalonProfileLayout(salonProfileLayout);

      // Save sticky navbar setting
      await adminAPI.updateStickyNavbar(stickyNavbar);

      // Save search version setting
      await adminAPI.updateSearchVersion(searchVersion);

      // Save featured salon settings
      await adminAPI.updateFeaturedSalon({
        salon_id: featuredSalonId,
        text: featuredSalonText,
        visibility: featuredSalonVisibility,
        show_top_rated: showTopRated,
        show_newest: showNewest,
      });
      
      setMessage({ type: 'success', text: 'Postavke izgleda su uspješno sačuvane! Osvježite stranicu da vidite promjene.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Greška prilikom čuvanja postavki izgleda.' });
    } finally {
      setGradientLoading(false);
    }
  };

  const selectPreset = (preset: GradientPreset) => {
    setCurrentGradient({
      preset: preset.id,
      from: preset.from,
      via: preset.via,
      to: preset.to,
      direction: preset.direction,
      custom: false
    });
    setUseCustomGradient(false);
  };

  const getGradientStyle = (gradient: { from: string; via?: string; to: string; direction: string }) => {
    const directionMap: Record<string, string> = {
      'r': 'to right',
      'l': 'to left',
      't': 'to top',
      'b': 'to bottom',
      'tr': 'to top right',
      'tl': 'to top left',
      'br': 'to bottom right',
      'bl': 'to bottom left',
    };
    const dir = directionMap[gradient.direction] || 'to right';
    if (gradient.via) {
      return { background: `linear-gradient(${dir}, ${gradient.from}, ${gradient.via}, ${gradient.to})` };
    }
    return { background: `linear-gradient(${dir}, ${gradient.from}, ${gradient.to})` };
  };

  const handleAnalyticsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyticsLoading(true);
    setMessage(null);
    
    try {
      await adminAPI.updateAnalyticsSettings({
        google_analytics_id: analyticsData.google_analytics_id,
        google_analytics_enabled: analyticsData.google_analytics_enabled,
      });
      setMessage({ type: 'success', text: 'Google Analytics podešavanja su uspješno sačuvana!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Greška prilikom čuvanja podešavanja.' });
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  const testAnalyticsConnection = async () => {
    if (!analyticsData.google_analytics_id) {
      setMessage({ type: 'error', text: 'Unesite Google Analytics Measurement ID.' });
      return;
    }
    
    setTestingConnection(true);
    // Validate GA4 Measurement ID format (G-XXXXXXXXXX)
    const ga4Pattern = /^G-[A-Z0-9]+$/;
    const uaPattern = /^UA-\d+-\d+$/;
    
    if (ga4Pattern.test(analyticsData.google_analytics_id)) {
      setMessage({ type: 'success', text: 'Validan GA4 Measurement ID format. Unesite ID i omogućite praćenje.' });
    } else if (uaPattern.test(analyticsData.google_analytics_id)) {
      setMessage({ type: 'success', text: 'Validan Universal Analytics ID format (UA). Preporučujemo prelazak na GA4.' });
    } else {
      setMessage({ type: 'error', text: 'Nevažeći format ID-a. GA4 format: G-XXXXXXXXXX' });
    }
    setTestingConnection(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const success = await updateUser(profileData);
      if (success) {
        setMessage({ type: 'success', text: 'Profil je uspješno ažuriran!' });
      } else {
        setMessage({ type: 'error', text: 'Greška prilikom ažuriranja profila.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Došlo je do greške.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.password_confirmation) {
      setMessage({ type: 'error', text: 'Lozinke se ne podudaraju.' });
      return;
    }
    
    if (passwordData.password.length < 8) {
      setMessage({ type: 'error', text: 'Lozinka mora imati najmanje 8 karaktera.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await authAPI.changePassword(passwordData.current_password, passwordData.password);
      setMessage({ type: 'success', text: 'Lozinka je uspješno promijenjena!' });
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Greška prilikom promjene lozinke.' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sigurnost', icon: Lock },
    { id: 'appearance', label: 'Izgled', icon: Palette },
    { id: 'registration', label: 'Registracija', icon: UserPlus },
    { id: 'notifications', label: 'Obavještenja', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleRegistrationSubmit = async () => {
    setRegistrationLoading(true);
    setMessage(null);
    
    try {
      await adminSettingsAPI.updateRegistrationSettings({
        allow_frizer_registration: allowFrizerRegistration
      });
      setMessage({ type: 'success', text: 'Postavke registracije su uspješno sačuvane!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Greška prilikom čuvanja postavki registracije.' });
    } finally {
      setRegistrationLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Podešavanja</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-gray-600">Administrator</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ime i prezime</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+387 61 123 456"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Čuvanje...' : 'Sačuvaj promjene'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Promjena lozinke</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trenutna lozinka</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova lozinka</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Potvrdi novu lozinku</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.password_confirmation}
                    onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? 'Čuvanje...' : 'Promijeni lozinku'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'registration' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Postavke registracije</h3>
                  <p className="text-sm text-gray-600">Upravljajte opcijama registracije korisnika</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Dozvoli registraciju frizera</span>
                    <span className="text-sm text-gray-600">
                      Kada je uključeno, korisnici mogu odabrati "Frizer" kao tip korisnika prilikom registracije.
                      Frizeri mogu upravljati svojim rasporedom i primati rezervacije.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowFrizerRegistration}
                    onChange={(e) => setAllowFrizerRegistration(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Napomena</h4>
                <p className="text-sm text-blue-800">
                  Ako je ova opcija isključena, na registracijskoj formi će biti dostupne samo opcije "Klijent" i "Salon".
                  Frizere možete dodati ručno kroz admin panel ili vlasnik salona može dodati frizere u svoj salon.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRegistrationSubmit}
                  disabled={registrationLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {registrationLoading ? 'Čuvanje...' : 'Sačuvaj promjene'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Podešavanja obavještenja</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Email obavještenja</span>
                    <span className="text-sm text-gray-600">Primaj obavještenja putem emaila</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Novi saloni</span>
                    <span className="text-sm text-gray-600">Obavijesti me kada se registruje novi salon</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Novi korisnici</span>
                    <span className="text-sm text-gray-600">Obavijesti me kada se registruje novi korisnik</span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Sistemska upozorenja</span>
                    <span className="text-sm text-gray-600">Primaj kritična sistemska upozorenja</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <form onSubmit={handleAnalyticsSubmit} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Google Analytics</h3>
                  <p className="text-sm text-gray-600">Pratite posjete i ponašanje korisnika na stranici</p>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className={`flex items-center gap-2 p-4 rounded-lg ${
                analyticsData.google_analytics_enabled && analyticsData.google_analytics_id 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                {analyticsData.google_analytics_enabled && analyticsData.google_analytics_id ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">Google Analytics je aktivan</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Google Analytics nije konfigurisan</span>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement ID (Tracking ID)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={analyticsData.google_analytics_id}
                      onChange={(e) => setAnalyticsData({ ...analyticsData, google_analytics_id: e.target.value.toUpperCase() })}
                      placeholder="G-XXXXXXXXXX"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                    <button
                      type="button"
                      onClick={testAnalyticsConnection}
                      disabled={testingConnection}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {testingConnection ? 'Provjera...' : 'Provjeri'}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Pronađite Measurement ID u Google Analytics → Admin → Data Streams → Web stream
                  </p>
                </div>

                <div className="border-t pt-4">
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <span className="font-medium text-gray-900 block">Omogući praćenje</span>
                      <span className="text-sm text-gray-600">Aktiviraj Google Analytics na svim stranicama</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={analyticsData.google_analytics_enabled}
                      onChange={(e) => setAnalyticsData({ ...analyticsData, google_analytics_enabled: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Kako postaviti Google Analytics
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>Idite na <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">analytics.google.com</a></li>
                    <li>Kreirajte novi "Property" za vašu stranicu</li>
                    <li>Odaberite "Web" kao platformu</li>
                    <li>Kopirajte Measurement ID (počinje sa G-)</li>
                    <li>Zalijepite ID gore i omogućite praćenje</li>
                  </ol>
                </div>

                {/* What we track */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Šta se prati:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Broj posjeta i jedinstvenih posjetilaca</li>
                    <li>• Koje stranice posjetitelji gledaju</li>
                    <li>• Koliko vremena provode na stranici</li>
                    <li>• Odakle dolaze posjetitelji (pretraživači, društvene mreže)</li>
                    <li>• Koji uređaji i preglednici se koriste</li>
                    <li>• Konverzije (rezervacije termina)</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={analyticsLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {analyticsLoading ? 'Čuvanje...' : 'Sačuvaj podešavanja'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appearance' && (
            <>
            <form onSubmit={handleAppearanceSubmit} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={getGradientStyle(currentGradient)}
                >
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gradient na početnoj stranici</h3>
                  <p className="text-sm text-gray-600">Prilagodite boje hero sekcije i navigacije</p>
                </div>
              </div>

              {/* Current gradient preview */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Trenutni gradient (pregled)</label>
                <div 
                  className="h-32 rounded-xl shadow-inner flex items-center justify-center"
                  style={getGradientStyle(currentGradient)}
                >
                  <span className="text-white font-bold text-xl drop-shadow-lg">Frizerino</span>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Predefinisane teme</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gradientPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`relative h-20 rounded-xl overflow-hidden transition-all ${
                        currentGradient.preset === preset.id && !useCustomGradient
                          ? 'ring-4 ring-blue-500 ring-offset-2'
                          : 'hover:scale-105'
                      }`}
                      style={getGradientStyle(preset)}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium drop-shadow-lg">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom gradient toggle */}
              <div className="border-t pt-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Prilagođeni gradient</span>
                    <span className="text-sm text-gray-600">Kreirajte vlastitu kombinaciju boja</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useCustomGradient}
                    onChange={(e) => setUseCustomGradient(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              {/* Custom gradient options */}
              {useCustomGradient && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Početna boja</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={currentGradient.from}
                          onChange={(e) => setCurrentGradient({ ...currentGradient, from: e.target.value, custom: true })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentGradient.from}
                          onChange={(e) => setCurrentGradient({ ...currentGradient, from: e.target.value, custom: true })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                          placeholder="#f43f5e"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Srednja boja (opcionalno)</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={currentGradient.via || '#ec4899'}
                          onChange={(e) => setCurrentGradient({ ...currentGradient, via: e.target.value, custom: true })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentGradient.via || ''}
                          onChange={(e) => setCurrentGradient({ ...currentGradient, via: e.target.value || undefined, custom: true })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                          placeholder="#ec4899"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Završna boja</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={currentGradient.to}
                          onChange={(e) => setCurrentGradient({ ...currentGradient, to: e.target.value, custom: true })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentGradient.to}
                          onChange={(e) => setCurrentGradient({ ...currentGradient, to: e.target.value, custom: true })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                          placeholder="#a855f7"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Smjer gradienta</label>
                    <select
                      value={currentGradient.direction}
                      onChange={(e) => setCurrentGradient({ ...currentGradient, direction: e.target.value, custom: true })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="r">Desno →</option>
                      <option value="l">Lijevo ←</option>
                      <option value="t">Gore ↑</option>
                      <option value="b">Dolje ↓</option>
                      <option value="br">Dolje desno ↘</option>
                      <option value="bl">Dolje lijevo ↙</option>
                      <option value="tr">Gore desno ↗</option>
                      <option value="tl">Gore lijevo ↖</option>
                    </select>
                  </div>
                </div>
              )}

            {/* Hero Background Image Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pozadinska slika naslovnice</h3>
                  <p className="text-sm text-gray-600">Dodajte sliku iza gradijenta na naslovnici</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL slike</label>
                  <input
                    type="text"
                    value={heroBackgroundImage}
                    onChange={(e) => setHeroBackgroundImage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://primjer.com/slika.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ostavite prazno da koristite samo gradijent. Slika će imati gradijent overlay.
                  </p>
                </div>

                {heroBackgroundImage && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Pregled</label>
                    <div className="relative h-48 rounded-xl overflow-hidden">
                      <img
                        src={heroBackgroundImage}
                        alt="Hero pozadina"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div 
                        className="absolute inset-0"
                        style={{
                          ...getGradientStyle(currentGradient),
                          opacity: 0.75
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl drop-shadow-lg">
                        Frizerino
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHeroBackgroundImage('')}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Ukloni sliku
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Salon Profile Layout Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Layout profila salona</h3>
                  <p className="text-sm text-gray-600">Odaberite kako će izgledati stranica salona za posjetioce</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Classic Layout */}
                <button
                  type="button"
                  onClick={() => handleLayoutSelect('classic')}
                  className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                    salonProfileLayout === 'classic' 
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-400 to-red-400 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">Klasični</h4>
                      <p className="text-sm text-gray-600 mt-1">Veliki hero sa slikom, overlay tekst, galerija ispod</p>
                    </div>
                    {salonProfileLayout === 'classic' && (
                      <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Classic with Description First Layout */}
                <button
                  type="button"
                  onClick={() => handleLayoutSelect('classic-desc-first')}
                  className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                    salonProfileLayout === 'classic-desc-first' 
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex flex-col overflow-hidden">
                      <div className="h-8 bg-gradient-to-r from-orange-400 to-red-400 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                      <div className="flex-1 p-1 flex flex-col">
                        <div className="w-full h-1.5 bg-gray-400 rounded mb-0.5" />
                        <div className="w-2/3 h-1.5 bg-gray-300 rounded mb-1" />
                        <div className="w-full h-4 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">Klasični (opis prvi)</h4>
                      <p className="text-sm text-gray-600 mt-1">Kao klasični, ali opis prije galerije na mobitelu</p>
                    </div>
                    {salonProfileLayout === 'classic-desc-first' && (
                      <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Compact Layout */}
                <button
                  type="button"
                  onClick={() => handleLayoutSelect('compact-hero')}
                  className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                    salonProfileLayout === 'compact-hero' 
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex flex-col overflow-hidden">
                      <div className="h-6 bg-gradient-to-r from-orange-400 to-red-400" />
                      <div className="flex-1 p-1">
                        <div className="w-full h-2 bg-gray-300 rounded mb-1" />
                        <div className="w-2/3 h-2 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">Kompaktni</h4>
                      <p className="text-sm text-gray-600 mt-1">Manji hero, opis odmah vidljiv, galerija ispod</p>
                    </div>
                    {salonProfileLayout === 'compact-hero' && (
                      <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Modern Card Layout */}
                <button
                  type="button"
                  onClick={() => handleLayoutSelect('modern-card')}
                  className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                    salonProfileLayout === 'modern-card' 
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 flex-shrink-0 flex items-center justify-center p-1">
                      <div className="w-full h-full bg-white rounded shadow-sm flex">
                        <div className="w-1/2 bg-gradient-to-br from-orange-200 to-red-200 rounded-l" />
                        <div className="w-1/2 p-1">
                          <div className="w-full h-1.5 bg-gray-300 rounded mb-1" />
                          <div className="w-2/3 h-1.5 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">Moderni kartica</h4>
                      <p className="text-sm text-gray-600 mt-1">Slika i info u kartici, moderan izgled</p>
                    </div>
                    {salonProfileLayout === 'modern-card' && (
                      <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Minimal Layout */}
                <button
                  type="button"
                  onClick={() => handleLayoutSelect('description-first')}
                  className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                    salonProfileLayout === 'description-first' 
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-white border flex-shrink-0 flex flex-col p-1.5">
                      <div className="flex gap-1 mb-1">
                        <div className="w-4 h-4 rounded bg-gray-200" />
                        <div className="flex-1">
                          <div className="w-full h-1.5 bg-gray-300 rounded mb-0.5" />
                          <div className="w-2/3 h-1.5 bg-gray-200 rounded" />
                        </div>
                      </div>
                      <div className="flex gap-0.5 mt-auto">
                        <div className="w-3 h-3 rounded bg-gray-100" />
                        <div className="w-3 h-3 rounded bg-gray-100" />
                        <div className="w-3 h-3 rounded bg-gray-100" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">Minimalistički</h4>
                      <p className="text-sm text-gray-600 mt-1">Čist dizajn, fokus na sadržaj, mala slika</p>
                    </div>
                    {salonProfileLayout === 'description-first' && (
                      <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>

            </div>

            {/* Featured Salon Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Istaknuti salon na početnoj</h3>
                  <p className="text-sm text-gray-600">Odaberite salon koji će biti prikazan kao &quot;Featured&quot; na početnoj stranici</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Headline text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Naslov sekcije</label>
                  <input
                    type="text"
                    value={featuredSalonText}
                    onChange={(e) => setFeaturedSalonText(e.target.value)}
                    placeholder="Otvoren je novi salon u vašem gradu"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Salon search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Istaknuti salon</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={salonSearchQuery}
                      onChange={(e) => {
                        setSalonSearchQuery(e.target.value);
                        setShowSalonDropdown(true);
                      }}
                      onFocus={() => setShowSalonDropdown(true)}
                      placeholder="Pretražite salon po imenu..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    {featuredSalonId && (
                      <button
                        type="button"
                        onClick={handleClearFeaturedSalon}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    
                    {/* Dropdown */}
                    {showSalonDropdown && salonSearchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {salonSearchResults.map((salon) => (
                          <button
                            key={salon.id}
                            type="button"
                            onClick={() => handleSelectFeaturedSalon(salon)}
                            className={`w-full px-4 py-2 text-left hover:bg-orange-50 flex items-center justify-between ${
                              featuredSalonId === salon.id ? 'bg-orange-50' : ''
                            }`}
                          >
                            <span className="font-medium">{salon.name}</span>
                            <span className="text-sm text-gray-500">{salon.city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {featuredSalonId && (
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Salon odabran (ID: {featuredSalonId})
                    </p>
                  )}
                  {!featuredSalonId && (
                    <p className="mt-2 text-sm text-gray-500">
                      Ako nije odabran salon, sekcija neće biti prikazana na početnoj stranici.
                    </p>
                  )}
                </div>

                {/* Visibility options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kome prikazati?</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFeaturedSalonVisibility('all')}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        featuredSalonVisibility === 'all'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          featuredSalonVisibility === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Svima</p>
                          <p className="text-sm text-gray-500">Svi posjetioci vide istaknuti salon</p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeaturedSalonVisibility('location_only')}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        featuredSalonVisibility === 'location_only'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          featuredSalonVisibility === 'location_only' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Samo lokalni korisnici</p>
                          <p className="text-sm text-gray-500">Samo korisnici iz istog grada</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section Visibility Toggles */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Prikaz sekcija na početnoj stranici</h4>
                  
                  {/* Top Rated Toggle */}
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <span className="text-lg">⭐</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Najbolje ocijenjeni saloni</p>
                        <p className="text-sm text-gray-500">Prikaži sekciju sa najbolje ocijenjenim salonima</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTopRated(!showTopRated)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showTopRated ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showTopRated ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Newest Toggle */}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="text-lg">🆕</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Najnoviji saloni</p>
                        <p className="text-sm text-gray-500">Prikaži sekciju sa novo otvorenim salonima</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewest(!showNewest)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showNewest ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showNewest ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Navbar Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Navigacija</h3>
                  <p className="text-sm text-gray-600">Postavke za navigacioni meni</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <span className="text-lg">📌</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Fiksiran meni pri skrolovanju</p>
                      <p className="text-sm text-gray-500">Meni ostaje na vrhu stranice kada korisnik skroluje</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStickyNavbar(!stickyNavbar)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      stickyNavbar ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        stickyNavbar ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Search Version Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Verzija Pretrage</h3>
                  <p className="text-sm text-gray-600">Izaberite kako će izgledati pretraga salona</p>
                </div>
              </div>

              <div className="space-y-4">
                {searchVersionLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Učitavanje...</span>
                  </div>
                ) : (
                  <>
                {/* Version 1 */}
                <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  searchVersion === 'v1' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="searchVersion"
                    value="v1"
                    checked={searchVersion === 'v1'}
                    onChange={(e) => setSearchVersion(e.target.value as 'v1' | 'v2')}
                    className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Verzija 1 - Sklopljeni Filteri</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Trenutna</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Filteri se otvaraju klikom na dugme "Filteri". Kompaktniji prikaz, manje prostora zauzima.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Kompaktno</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Manje prostora</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Klasičan izgled</span>
                    </div>
                  </div>
                </label>

                {/* Version 2 */}
                <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  searchVersion === 'v2' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}>
                  <input
                    type="radio"
                    name="searchVersion"
                    value="v2"
                    checked={searchVersion === 'v2'}
                    onChange={(e) => setSearchVersion(e.target.value as 'v1' | 'v2')}
                    className="mt-1 w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Verzija 2 - Raspakovan Filteri</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Novo</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Svi filteri uvijek vidljivi. Autocomplete za grad i uslugu. Toggle buttons za gender (M/Ž/D). Brži pristup filterima.
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Autocomplete</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Uvijek vidljivo</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Brži pristup</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Moderan</span>
                    </div>
                  </div>
                </label>
                </>
                )}
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">Napomena</p>
                    <p className="text-sm text-blue-700">
                      Nakon promjene verzije, osvježite stranicu da vidite izmjene. Korisnici će odmah vidjeti novu verziju pretrage.
                    </p>
                  </div>
                </div>
              </div>
            </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 mt-8 border-t">
                <button
                  type="submit"
                  disabled={gradientLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 disabled:opacity-50 font-medium shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  {gradientLoading ? 'Čuvanje...' : 'Sačuvaj postavke izgleda'}
                </button>
              </div>
            </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
