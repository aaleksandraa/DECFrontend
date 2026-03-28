import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { Sidebar } from '../Layout/Sidebar';
import { useAuth } from '../../context/AuthContext';

// Dashboard components for different user types
import { AdminDashboard } from './AdminDashboard';
import { SalonDashboard } from './SalonDashboard';
import { FrizerDashboard } from './FrizerDashboard';
import { ClientDashboard } from './ClientDashboard';

// Client components
import { SalonSearchWithMap } from '../Client/SalonSearchWithMap';
import { ClientAppointments } from '../Client/ClientAppointments';
import { ClientProfile } from '../Client/ClientProfile';
import { FavoriteSalons } from '../Client/FavoriteSalons';

// Salon components
import { SalonProfile } from '../Salon/SalonProfile';
import { SalonAppointments } from '../Salon/SalonAppointments';
import { SalonStaff } from '../Salon/SalonStaff';
import { SalonServices } from '../Salon/SalonServices';
import { SalonAnalytics } from '../Salon/SalonAnalytics';
import { SalonReviews } from '../Salon/SalonReviews';
import { SalonSchedule } from '../Salon/SalonSchedule';
import { SalonCalendar } from '../Salon/SalonCalendar';
import { SalonClients } from '../Salon/SalonClients';
import { SalonJobAds } from '../Salon/SalonJobAds';
import { SalonSetupWizard } from '../Salon/SalonSetupWizard';
import { PendingSalonDashboard } from '../Salon/PendingSalonDashboard';
import SalonReportSettings from '../Salon/SalonReportSettings';
import SocialIntegrationsPage from '../../pages/Admin/SocialIntegrationsPage';

// Admin components
import { AdminSalons } from '../Admin/AdminSalons';
import { AdminUsers } from '../Admin/AdminUsers';
import { AdminAnalytics } from '../Admin/AdminAnalytics';
import { AdminSettings } from '../Admin/AdminSettings';
import { AdminConsents } from '../Admin/AdminConsents';
import { AdminJobAds } from '../Admin/AdminJobAds';
import { AdminWidgetManagement } from '../Admin/AdminWidgetManagement';
import { AdminImportAppointments } from '../Admin/AdminImportAppointments';
import { AdminImportHistory } from '../Admin/AdminImportHistory';
import AdminHomepageCategories from '../Admin/AdminHomepageCategories';
import { AdminSocialIntegrationsHealth } from '../Admin/AdminSocialIntegrationsHealth';

// Frizer components
import { FrizerCalendar } from '../Frizer/FrizerCalendar';
import { FrizerSchedule } from '../Frizer/FrizerSchedule';
import { FrizerSettings } from '../Frizer/FrizerSettings';
import { FrizerReviews } from '../Frizer/FrizerReviews';

export function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Check if user is a client (no sidebar for clients)
  const isClient = user?.role === 'klijent';
  
  // Check if salon owner needs to complete setup
  const isSalonOwner = user?.role === 'salon';
  const salonStatus = user?.salon?.status;
  const needsSetup = isSalonOwner && (!user?.salon || !user?.salon?.name || !user?.salon?.address);
  const isPendingSalon = isSalonOwner && salonStatus === 'pending';

  // Parse section from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [location.search]);

  // Check if new salon owner needs setup wizard
  useEffect(() => {
    if (needsSetup) {
      setShowSetupWizard(true);
    }
  }, [needsSetup]);

  // Listen for section changes from header
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail);
    };

    window.addEventListener('switchSection', handleSectionChange as EventListener);
    return () => window.removeEventListener('switchSection', handleSectionChange as EventListener);
  }, []);

  const handleBookingComplete = () => {
    if (user?.role === 'klijent') {
      setActiveSection('appointments');
      navigate('?booking=success');
    }
  };

  const handleSetupComplete = async () => {
    setShowSetupWizard(false);
    // Refresh user data to get updated salon info
    if (refreshUser) {
      await refreshUser();
    }
  };

  // Show setup wizard for new salon owners
  if (showSetupWizard && isSalonOwner) {
    return <SalonSetupWizard onComplete={handleSetupComplete} />;
  }

  const renderContent = () => {
    switch (user?.role) {
      case 'admin':
        switch (activeSection) {
          case 'dashboard': return <AdminDashboard />;
          case 'salons': return <AdminSalons />;
          case 'users': return <AdminUsers />;
          case 'import': return <AdminImportAppointments />;
          case 'import-history': return <AdminImportHistory />;
          case 'widgets': return <AdminWidgetManagement />;
          case 'social-health': return <AdminSocialIntegrationsHealth />;
          case 'consents': return <AdminConsents />;
          case 'job-ads': return <AdminJobAds />;
          case 'homepage-categories': return <AdminHomepageCategories />;
          case 'analytics': return <AdminAnalytics />;
          case 'settings': return <AdminSettings />;
          case 'profile': return <ClientProfile />;
          default: return <AdminDashboard />;
        }
      
      case 'salon':
        // For pending salons, only show profile and pending dashboard
        if (isPendingSalon) {
          switch (activeSection) {
            case 'profile': return <SalonProfile />;
            case 'settings': return <SalonProfile />;
            default: return <PendingSalonDashboard />;
          }
        }
        
        // For approved salons, show full functionality
        switch (activeSection) {
          case 'dashboard': return <SalonDashboard onSectionChange={setActiveSection} />;
          case 'profile': return <SalonProfile />;
          case 'appointments': return <SalonAppointments />;
          case 'staff': return <SalonStaff />;
          case 'services': return <SalonServices />;
          case 'schedule': return <SalonSchedule />;
          case 'calendar': return <SalonCalendar />;
          case 'analytics': return <SalonAnalytics />;
          case 'reviews': return <SalonReviews />;
          case 'clients': return <SalonClients />;
          case 'job-ads': return <SalonJobAds />;
          case 'reports': return <SalonReportSettings />;
          case 'social-integrations': return <SocialIntegrationsPage />;
          case 'settings': return <SalonProfile />;
          default: return <SalonDashboard onSectionChange={setActiveSection} />;
        }
      
      case 'frizer':
        switch (activeSection) {
          case 'dashboard': return <FrizerDashboard />;
          case 'calendar': return <FrizerCalendar />;
          case 'schedule': return <FrizerSchedule />;
          case 'reviews': return <FrizerReviews />;
          case 'analytics': return <SalonAnalytics />;
          case 'clients': return <SalonClients />;
          case 'settings': return <FrizerSettings />;
          default: return <FrizerDashboard />;
        }
      
      case 'klijent':
        switch (activeSection) {
          case 'dashboard': return <ClientDashboard onBookingComplete={handleBookingComplete} />;
          case 'search': return <SalonSearchWithMap />;
          case 'appointments': return <ClientAppointments />;
          case 'history': return <ClientAppointments />;
          case 'favorites': return <FavoriteSalons />;
          case 'profile': return <ClientProfile />;
          case 'settings': return <ClientProfile />;
          default: return <ClientDashboard onBookingComplete={handleBookingComplete} />;
        }
      
      default:
        return <div>Unauthorized</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <div className="flex">
        {/* Show sidebar only for non-clients (tablet and desktop) */}
        {!isClient && (
          <Sidebar 
            activeSection={activeSection} 
            onSectionChange={setActiveSection}
            isPendingSalon={isPendingSalon}
          />
        )}
        
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
