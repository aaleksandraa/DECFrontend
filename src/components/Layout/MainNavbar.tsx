import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppearance } from '../../context/AppearanceContext';
import { notificationAPI } from '../../services/api';
import { StaffRole, StaffRoleLabels } from '../../types';
import { 
  XMarkIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  HeartIcon,
  StarIcon,
  MapPinIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { ScissorsIcon } from '@heroicons/react/24/solid';

interface MainNavbarProps {
  transparent?: boolean;
}

export const MainNavbar: React.FC<MainNavbarProps> = ({ transparent = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { navbarGradient, getGradientStyle, stickyNavbar } = useAppearance();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for transparent navbar
  useEffect(() => {
    if (!transparent) return;
    
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent, isScrolled]);

  // Check if we're on a dashboard page
  const isDashboardPage = location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/salon') ||
    location.pathname.startsWith('/frizer') ||
    location.pathname.startsWith('/client');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Public navigation links (for guests)
  const publicLinks = [
    { path: '/', label: 'Početna', icon: HomeIcon },
    { path: '/pretraga', label: 'Pretraga', icon: MagnifyingGlassIcon },
    { path: '/cjenovnik', label: 'Cjenovnik', icon: CreditCardIcon },
    { path: '/o-nama', label: 'O nama', icon: UserCircleIcon },
    { path: '/kontakt', label: 'Kontakt', icon: PhoneIcon },
  ];

  // Client navigation links (for logged in clients)
  const clientLinks = [
    { path: '/', label: 'Početna', icon: HomeIcon },
    { path: '/pretraga', label: 'Pretraga', icon: MagnifyingGlassIcon },
    { path: '/moji-termini', label: 'Moji termini', icon: CalendarDaysIcon },
    { path: '/omiljeni-saloni', label: 'Omiljeni saloni', icon: HeartIcon },
    { path: '/o-nama', label: 'O nama', icon: UserCircleIcon },
    { path: '/kontakt', label: 'Kontakt', icon: PhoneIcon },
  ];

  // Check if user is a client
  const isClient = user?.role === 'klijent';
  const isSalon = user?.role === 'salon';
  const isFrizer = user?.role === 'frizer';
  const isAdmin = user?.role === 'admin';
  
  // Dashboard links for salon owners (mobile menu)
  const salonDashboardLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'profile', label: 'Profil salona', icon: BuildingStorefrontIcon },
    { id: 'staff', label: 'Zaposleni', icon: UsersIcon },
    { id: 'services', label: 'Usluge', icon: WrenchScrewdriverIcon },
    { id: 'schedule', label: 'Raspored', icon: ClockIcon },
    { id: 'calendar', label: 'Kalendar', icon: CalendarDaysIcon },
    { id: 'analytics', label: 'Analitika', icon: ChartBarIcon },
    { id: 'reviews', label: 'Recenzije', icon: StarIcon },
    { id: 'clients', label: 'Klijenti', icon: UserCircleIcon },
    { id: 'settings', label: 'Podešavanja', icon: Cog6ToothIcon }
  ];

  // Dashboard links for staff/frizer (mobile menu)
  const frizerDashboardLinks = [
    { id: 'dashboard', label: 'Moji termini', icon: HomeIcon },
    { id: 'calendar', label: 'Kalendar', icon: CalendarDaysIcon },
    { id: 'schedule', label: 'Raspored', icon: ClockIcon },
    { id: 'reviews', label: 'Recenzije', icon: StarIcon },
    { id: 'analytics', label: 'Analitika', icon: ChartBarIcon },
    { id: 'clients', label: 'Klijenti', icon: UserCircleIcon },
    { id: 'settings', label: 'Podešavanja', icon: Cog6ToothIcon }
  ];

  // Dashboard links for admin (mobile menu)
  const adminDashboardLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'salons', label: 'Svi saloni', icon: MapPinIcon },
    { id: 'users', label: 'Korisnici', icon: UsersIcon },
    { id: 'analytics', label: 'Analitika', icon: ChartBarIcon },
    { id: 'settings', label: 'Podešavanja', icon: Cog6ToothIcon }
  ];

  // Get dashboard links based on role
  const getDashboardLinks = () => {
    if (isSalon) return salonDashboardLinks;
    if (isFrizer) return frizerDashboardLinks;
    if (isAdmin) return adminDashboardLinks;
    return [];
  };

  const dashboardLinks = getDashboardLinks();
  
  // Determine which links to show based on user role
  const getNavLinks = () => {
    if (!user) return publicLinks;
    if (isClient) return clientLinks;
    // For salon, frizer, admin - show public links on public pages
    return publicLinks;
  };
  
  const navLinks = getNavLinks();

  // Load notifications on mount and poll every 30 seconds
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfile && !target.closest('.profile-dropdown-container')) {
        setShowProfile(false);
      }
      if (showNotifications && !target.closest('.notifications-dropdown-container')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile, showNotifications]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ per_page: 10 });
      const notificationData = response.data || response;
      setNotifications(Array.isArray(notificationData) ? notificationData : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error: any) {
      // Silently fail for 401/403 errors (user not authenticated)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('Not authenticated for notifications');
        setUnreadCount(0);
      } else {
        console.error('Error loading unread count:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'salon': return '/salon';
      case 'frizer': return '/frizer';
      case 'klijent': return '/client';
      default: return '/dashboard';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'salon': return 'Vlasnik salona';
      case 'frizer': 
        if (user?.staff_profile?.role) {
          return StaffRoleLabels[user.staff_profile.role as StaffRole] || user.staff_profile.role;
        }
        return 'Zaposleni';
      case 'klijent': return 'Klijent';
      default: return role;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      if (!notification.is_read) {
        await notificationAPI.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      setShowNotifications(false);

      switch (notification.type) {
        case 'new_appointment':
        case 'appointment_confirmed':
        case 'appointment_cancelled':
        case 'appointment_reminder':
        case 'appointment_completed':
          // Navigate to calendar with date and appointment highlighted
          if (user?.role === 'klijent') {
            navigate('/moji-termini');
          } else if (notification.related_id) {
            // For salon/staff, navigate to calendar
            const dashboardPath = user?.role === 'salon' ? '/salon/dashboard' : '/frizer/dashboard';
            
            // If we have appointment data in notification, use it
            if (notification.data?.appointment_date) {
              // Convert DD.MM.YYYY to YYYY-MM-DD for URL
              const dateParts = notification.data.appointment_date.split('.');
              if (dateParts.length === 3) {
                const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                navigate(`${dashboardPath}?date=${isoDate}&appointment=${notification.related_id}`);
              } else {
                navigate(`${dashboardPath}?appointment=${notification.related_id}`);
              }
            } else {
              navigate(`${dashboardPath}?appointment=${notification.related_id}`);
            }
          } else {
            navigate(user?.role === 'salon' ? '/salon/dashboard' : '/frizer/dashboard');
          }
          break;
        case 'new_review':
        case 'review_response':
          if (user?.role === 'salon' || user?.role === 'frizer') {
            navigate('/dashboard?section=reviews');
          }
          break;
        case 'favorite_added':
        case 'new_favorite':
          if (user?.role === 'klijent') {
            navigate('/omiljeni-saloni');
          } else {
            navigate('/dashboard?section=favorites');
          }
          break;
        default:
          navigate('/dashboard');
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
    setShowProfile(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
      case 'appointment_completed':
      case 'appointment_reminder':
        return CalendarDaysIcon;
      case 'new_review':
      case 'review_response':
        return StarIcon;
      case 'favorite_added':
      case 'new_favorite':
        return HeartIcon;
      case 'salon_status_change':
        return MapPinIcon;
      default:
        return BellIcon;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_appointment': return 'text-blue-600 bg-blue-100';
      case 'appointment_confirmed': return 'text-green-600 bg-green-100';
      case 'appointment_cancelled': return 'text-red-600 bg-red-100';
      case 'appointment_completed': return 'text-purple-600 bg-purple-100';
      case 'appointment_reminder': return 'text-orange-600 bg-orange-100';
      case 'new_review':
      case 'review_response': return 'text-yellow-600 bg-yellow-100';
      case 'favorite_added':
      case 'new_favorite': return 'text-pink-600 bg-pink-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  // For logged-in users on transparent pages, we want sticky with gradient background
  // For all users on transparent pages: transparent at top, gradient when scrolled
  const navClasses = () => {
    if (transparent) {
      // On homepage (transparent mode)
      if (stickyNavbar) {
        if (isScrolled) {
          // Scrolled - show gradient background with shadow
          return 'fixed top-0 left-0 right-0 shadow-lg transition-all duration-300';
        } else {
          // At top - transparent
          return 'fixed top-0 left-0 right-0 bg-transparent transition-all duration-300';
        }
      } else {
        // Not sticky - always transparent
        return 'absolute top-0 left-0 right-0 bg-transparent';
      }
    } else if (user) {
      // Logged in user on other pages
      if (stickyNavbar) {
        return 'sticky top-0 bg-white shadow-sm border-b border-gray-200';
      } else {
        return 'bg-white shadow-sm border-b border-gray-200';
      }
    } else {
      // Guest on other pages
      if (stickyNavbar) {
        return 'sticky top-0 bg-white shadow-sm border-b border-gray-200';
      } else {
        return 'bg-white shadow-sm border-b border-gray-200';
      }
    }
  };

  // Get navbar style for gradient (when scrolled on transparent pages)
  const getNavbarStyle = (): React.CSSProperties => {
    if (transparent && isScrolled) {
      // Use custom gradient from settings when scrolled
      const style = getGradientStyle(navbarGradient);
      if (Object.keys(style).length > 0) {
        return style;
      }
      // Fallback to default orange gradient
      return {
        background: `linear-gradient(to right, ${navbarGradient.from}, ${navbarGradient.via || navbarGradient.from}, ${navbarGradient.to})`
      };
    }
    return {};
  };

  return (
    <nav className={`${navClasses()} z-50`} style={getNavbarStyle()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side: Logo */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className={`${transparent ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'} p-2 rounded-lg transition-all`}>
                <ScissorsIcon className="w-6 h-6 text-white" />
              </div>
            </Link>
          </div>

          {/* Center: Navigation Links (desktop only) */}
          {/* For clients: show client menu everywhere */}
          {/* For guests: show public menu on non-dashboard pages */}
          {/* For salon/frizer/admin: show public menu only on public pages (sidebar handles dashboard) */}
          {(isClient || !isDashboardPage) && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path) || (link.path.includes('section=') && location.search.includes(link.path.split('?')[1]))
                      ? transparent ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600'
                      : transparent ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right side: Auth buttons / User menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative notifications-dropdown-container">
                  <button 
                    onClick={async () => {
                      const opening = !showNotifications;
                      setShowNotifications(opening);
                      if (opening) {
                        await loadNotifications();
                        // Mark all as read when opening notifications
                        if (unreadCount > 0) {
                          markAllAsRead();
                        }
                      }
                    }}
                    className={`relative p-2 rounded-lg transition-colors ${transparent ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                  >
                    <BellIcon className={`w-5 h-5 ${transparent ? 'text-white' : 'text-gray-600'}`} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto mt-2 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-[100] max-h-96 overflow-hidden">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">Obavještenja</h3>
                          <button 
                            onClick={() => setShowNotifications(false)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <XMarkIcon className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        {unreadCount > 0 && (
                          <p className="text-sm text-gray-600 mt-1">{unreadCount} nepročitanih</p>
                        )}
                      </div>
                      
                      <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                          <div className="p-8 text-center">
                            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-500">Učitavanje...</p>
                          </div>
                        ) : notifications.length > 0 ? (
                          notifications.map(notification => {
                            const Icon = getNotificationIcon(notification.type);
                            const colorClass = getNotificationColor(notification.type);
                            
                            return (
                              <div 
                                key={notification.id} 
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                  !notification.is_read ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium text-gray-900 text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                                      {notification.title}
                                    </h4>
                                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                                    <p className="text-gray-500 text-xs mt-2">{notification.created_at_diff}</p>
                                  </div>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center">
                            <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Nema novih obavještenja</p>
                          </div>
                        )}
                      </div>
                      
                      {notifications.length > 0 && unreadCount > 0 && (
                        <div className="p-4 border-t border-gray-200">
                          <button 
                            onClick={markAllAsRead}
                            className="w-full text-center text-orange-600 hover:text-orange-700 font-medium text-sm"
                          >
                            Označi sve kao pročitano
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashboard Link - show only on public pages for non-clients (desktop) */}
                {!isDashboardPage && !isClient && (
                  <Link
                    to={getDashboardLink()}
                    className="hidden md:flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Moj Panel
                  </Link>
                )}

                {/* User Avatar & Profile Dropdown */}
                <div className="relative profile-dropdown-container">
                  <button 
                    onClick={() => setShowProfile(!showProfile)}
                    className={`flex items-center gap-2 p-1 rounded-lg transition-colors ${transparent ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.staff_profile?.avatar_url || user?.avatar ? (
                        <img 
                          src={user?.staff_profile?.avatar_url || user?.avatar} 
                          alt={user?.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${transparent ? 'bg-white/20' : 'bg-gradient-to-r from-orange-500 to-red-500'} flex items-center justify-center`}>
                          <span className="text-white font-semibold text-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={`hidden lg:block text-sm font-medium ${transparent ? 'text-white' : 'text-gray-700'}`}>{user?.name?.split(' ')[0]}</span>
                  </button>

                  {/* Profile Dropdown - Full menu for mobile */}
                  {showProfile && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-[100] max-h-[80vh] overflow-y-auto">
                      {/* User info header */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                            {user?.staff_profile?.avatar_url || user?.avatar ? (
                              <img 
                                src={user?.staff_profile?.avatar_url || user?.avatar} 
                                alt={user?.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {user?.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                            <p className="text-xs text-orange-600">{getRoleLabel(user?.role || '')}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Dashboard links for salon/frizer/admin - show only on small mobile */}
                      {(isSalon || isFrizer || isAdmin) && (
                        <div className="p-2 border-b border-gray-200 md:hidden">
                          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Panel</p>
                          {dashboardLinks.map((item) => {
                            const Icon = item.icon;
                            const currentSection = new URLSearchParams(location.search).get('section') || 'dashboard';
                            const isItemActive = isDashboardPage && currentSection === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  navigate(`/dashboard?section=${item.id}`);
                                  setShowProfile(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                                  isItemActive
                                    ? 'bg-orange-50 text-orange-600'
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Public navigation links - show on public pages for clients only */}
                      {!isDashboardPage && isClient && (
                        <div className="p-2 border-b border-gray-200 md:hidden">
                          <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Navigacija</p>
                          <Link
                            to="/"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <HomeIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">Početna</span>
                          </Link>
                          <Link
                            to="/pretraga"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">Pretraga</span>
                          </Link>
                          <Link
                            to="/o-nama"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <UserCircleIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">O nama</span>
                          </Link>
                          <Link
                            to="/kontakt"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <PhoneIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">Kontakt</span>
                          </Link>
                        </div>
                      )}
                      
                      {/* Main menu items */}
                      <div className="p-2">
                        {/* Moj Panel - for non-clients on public pages, desktop only */}
                        {!isClient && !isDashboardPage && (
                          <Link
                            to={getDashboardLink()}
                            onClick={() => setShowProfile(false)}
                            className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <UserCircleIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">Moj Panel</span>
                          </Link>
                        )}

                        {/* Početna stranica - for non-clients on dashboard pages */}
                        {!isClient && isDashboardPage && (
                          <>
                            <Link
                              to="/"
                              onClick={() => setShowProfile(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <HomeIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">Početna stranica</span>
                            </Link>
                            <Link
                              to="/o-nama"
                              onClick={() => setShowProfile(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <UserCircleIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">O nama</span>
                            </Link>
                          </>
                        )}
                        
                        {/* Client quick links */}
                        {isClient && (
                          <>
                            <Link
                              to="/moji-termini"
                              onClick={() => setShowProfile(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">Moji termini</span>
                            </Link>
                            
                            <Link
                              to="/omiljeni-saloni"
                              onClick={() => setShowProfile(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <HeartIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">Omiljeni saloni</span>
                            </Link>
                          </>
                        )}
                        
                        {/* Podešavanja - only for clients (salon/frizer/admin have it in dashboardLinks) */}
                        {isClient && (
                          <Link
                            to="/dashboard?section=settings"
                            onClick={() => setShowProfile(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Cog6ToothIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">Podešavanja</span>
                          </Link>
                        )}
                      </div>
                      
                      {/* Logout */}
                      <div className="p-2 border-t border-gray-200">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Odjavi se</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest buttons */
              <>
                {/* Mobile: Show "O nama" and "Kontakt" links */}
                <Link
                  to="/o-nama"
                  className={`sm:hidden text-sm font-medium transition-colors ${
                    transparent ? 'text-white' : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  O nama
                </Link>
                {/* Mobile separator */}
                <span className={`sm:hidden text-sm ${transparent ? 'text-white/40' : 'text-gray-300'}`}>|</span>
                <Link
                  to="/kontakt"
                  className={`sm:hidden text-sm font-medium transition-colors ${
                    transparent ? 'text-white' : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  Kontakt
                </Link>
                {/* Mobile separator */}
                <span className={`sm:hidden text-sm ${transparent ? 'text-white/40' : 'text-gray-300'}`}>|</span>
                <Link
                  to="/login"
                  className={`hidden sm:flex items-center gap-1 px-4 py-2 transition-colors text-sm font-medium ${
                    transparent ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  Prijavi se
                </Link>
                {/* Mobile: Show "Prijavi se", Desktop: Show "Registruj se" */}
                <Link
                  to="/login"
                  className={`sm:hidden px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    transparent 
                      ? 'bg-white text-pink-600 hover:bg-white/90' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  Prijavi se
                </Link>
                <Link
                  to="/register"
                  className={`hidden sm:block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    transparent 
                      ? 'bg-white text-pink-600 hover:bg-white/90' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  Registruj se
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;
