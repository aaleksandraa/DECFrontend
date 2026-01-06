import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppearanceProvider } from './context/AppearanceContext';
import { publicSettingsAPI } from './services/api';
import { AuthPage } from './components/Auth/AuthPage';
import { RegistrationSuccessPage } from './components/Auth/RegistrationSuccessPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { 
  PublicSearch, 
  CityPage, 
  PublicSalonPage, 
  ContactPage,
  AboutPage,
  HowToRegisterSalonPage,
  HowToBookPage,
  HowToCancelPage,
  PrivacyPolicyPage,
  TermsOfServicePage,
  VerifyEmailPage,
  JobAdsPage
} from './components/Public';
import { PricingPage } from './components/Public/PricingPage';
import PublicSearchV2 from './components/Public/PublicSearchV2_Full';
import { AboutPageNew } from './components/Public/AboutPageNew';
import { ForClientsPage } from './components/Public/ForClientsPage';
import { ForSalonsPage } from './components/Public/ForSalonsPage';
import { AboutPlatformPage } from './components/Public/AboutPlatformPage';
import { GoogleAnalytics } from './components/Analytics';
import { WidgetBooking } from './pages/WidgetBooking';
import { ClientAppointmentsPage } from './pages/ClientAppointmentsPage';
import { ClientFavoritesPage } from './pages/ClientFavoritesPage';
import { ClientHomePage } from './pages/ClientHomePage';
import { StaffProfilePage } from './pages/StaffProfilePage';

// Login page wrapper
function LoginPage() {
  return <AuthPage mode="login" />;
}

// Register page wrapper
function RegisterPage() {
  return <AuthPage mode="register" />;
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AuthWrapper() {
  const { user, loading } = useAuth();
  
  // Determine which search version to use - MUST BE AT TOP
  // Try to load from localStorage first for instant display
  const [searchVersion, setSearchVersion] = useState<'v1' | 'v2'>(() => {
    const cached = localStorage.getItem('search_version');
    return (cached as 'v1' | 'v2') || 'v1';
  });
  const [versionLoaded, setVersionLoaded] = useState(false);

  // Load search version from API and cache it
  useEffect(() => {
    const loadSearchVersion = async () => {
      try {
        const settings = await publicSettingsAPI.getAppearanceSettings();
        const version = settings.search_version || 'v1';
        setSearchVersion(version);
        localStorage.setItem('search_version', version);
        setVersionLoaded(true);
      } catch (error) {
        console.error('Error loading search version:', error);
        // Fallback to ENV variable if API fails
        const envVersion = import.meta.env.VITE_SEARCH_VERSION || 'v1';
        setSearchVersion(envVersion as 'v1' | 'v2');
        localStorage.setItem('search_version', envVersion);
        setVersionLoaded(true);
      }
    };
    loadSearchVersion();
  }, []);

  const SearchComponent = searchVersion === 'v2' ? PublicSearchV2 : PublicSearch;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes - Available to everyone */}
      <Route path="/" element={<SearchComponent />} />
      <Route path="/pretraga" element={<SearchComponent />} />
      <Route path="/o-nama-old" element={<AboutPage />} />
      
      {/* About Pages - Main page redirects to za-klijente */}
      <Route path="/o-nama" element={<AboutPageNew />}>
        <Route index element={<ForClientsPage />} />
      </Route>
      <Route path="/za-klijente" element={<AboutPageNew />}>
        <Route index element={<ForClientsPage />} />
      </Route>
      <Route path="/za-salone" element={<AboutPageNew />}>
        <Route index element={<ForSalonsPage />} />
      </Route>
      <Route path="/o-platformi" element={<AboutPageNew />}>
        <Route index element={<AboutPlatformPage />} />
      </Route>
      
      <Route path="/kontakt" element={<ContactPage />} />
      <Route path="/cjenovnik" element={<PricingPage />} />
      
      {/* City and category routes - order matters! */}
      <Route path="/saloni/:citySlug/:categorySlug" element={<CityPage />} />
      <Route path="/saloni/:citySlug" element={<CityPage />} />
      <Route path="/salon/:slug" element={<PublicSalonPage />} />
      <Route path="/profil/:slug" element={<StaffProfilePage />} />
      
      {/* Help Pages */}
      <Route path="/pomoc/kako-registrovati-salon" element={<HowToRegisterSalonPage />} />
      <Route path="/pomoc/kako-zakazati-termin" element={<HowToBookPage />} />
      <Route path="/pomoc/kako-otkazati-rezervaciju" element={<HowToCancelPage />} />
      
      {/* Job Ads */}
      <Route path="/oglasi-za-posao" element={<JobAdsPage />} />
      <Route path="/politika-privatnosti" element={<PrivacyPolicyPage />} />
      <Route path="/uslovi-koristenja" element={<TermsOfServicePage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/prijava" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/registracija" element={<RegisterPage />} />
      <Route path="/registration-success" element={<RegistrationSuccessPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/zaboravljena-lozinka" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Client Routes - Dedicated pages for logged in clients */}
      <Route path="/moji-termini" element={
        !user ? <AuthPage mode="login" /> : <ClientAppointmentsPage />
      } />
      <Route path="/omiljeni-saloni" element={
        !user ? <AuthPage mode="login" /> : <ClientFavoritesPage />
      } />
      <Route path="/moj-profil" element={
        !user ? <AuthPage mode="login" /> : <ClientHomePage />
      } />
      
      {/* Dashboard Route - For logged in users */}
      <Route path="/dashboard/*" element={
        !user ? <AuthPage mode="login" /> : <Dashboard />
      } />
      
      {/* Catch-all - Shows dashboard if logged in, otherwise public search */}
      <Route path="/*" element={
        !user ? <SearchComponent /> : <Dashboard />
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <GoogleAnalytics />
        <ScrollToTop />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Widget Route - MUST be outside AuthWrapper to avoid auth checks */}
          <Route path="/widget/:salonSlug" element={<WidgetBooking />} />
          
          {/* All other routes go through AuthWrapper */}
          <Route path="/*" element={<AuthWrapper />} />
        </Routes>
      </AppearanceProvider>
    </AuthProvider>
  );
}

export default App;