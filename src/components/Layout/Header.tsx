import React, { useState, useEffect } from 'react';
import { LogOut, User, Calendar, Settings, Bell, Menu, X, Heart, Star, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { StaffRole, StaffRoleLabels } from '../../types';

interface HeaderProps {
  title: string;
  onMenuToggle?: () => void;
}

export function Header({ title, onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the profile dropdown
      if (showProfile && !target.closest('.profile-dropdown-container')) {
        setShowProfile(false);
      }
      // Check if click is outside the notifications dropdown
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
      console.log('Loading notifications...');
      const response = await notificationAPI.getNotifications({ per_page: 10 });
      console.log('Notifications response:', response);
      // Handle paginated response
      const notificationData = response.data || response;
      console.log('Notification data:', notificationData);
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
      console.log('Loading unread count...');
      const response = await notificationAPI.getUnreadCount();
      console.log('Unread count response:', response);
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
      // Set to 0 on error to prevent UI issues
      setUnreadCount(0);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'salon': return 'Vlasnik salona';
      case 'frizer': 
        // Check if user has a staff profile with a specific role
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
      // Mark as read if not already read
      if (!notification.is_read) {
        await notificationAPI.markAsRead(notification.id);
        
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate based on notification type and user role
      const navigateToSection = (section: string) => {
        if (location.pathname === '/dashboard') {
          const event = new CustomEvent('switchSection', { detail: section });
          window.dispatchEvent(event);
        } else {
          navigate('/dashboard');
          setTimeout(() => {
            const event = new CustomEvent('switchSection', { detail: section });
            window.dispatchEvent(event);
          }, 100);
        }
      };

      switch (notification.type) {
        case 'new_appointment':
        case 'appointment_confirmed':
        case 'appointment_cancelled':
        case 'appointment_reminder':
          navigateToSection('appointments');
          break;
        case 'appointment_completed':
          // Navigate to appointments history tab where client can leave a review
          if (user?.role === 'klijent') {
            navigateToSection('appointments');
            // After navigation, switch to history tab
            setTimeout(() => {
              const event = new CustomEvent('switchAppointmentTab', { detail: 'past' });
              window.dispatchEvent(event);
            }, 150);
          } else {
            navigateToSection('appointments');
          }
          break;
        case 'new_review':
        case 'review_response':
          if (user?.role === 'salon' || user?.role === 'frizer') {
            navigateToSection('reviews');
          }
          break;
        case 'favorite_added':
          if (user?.role === 'klijent') {
            navigateToSection('favorites');
          }
          break;
        case 'new_favorite':
          if (user?.role === 'salon') {
            navigateToSection('salon');
          }
          break;
        case 'salon_status_change':
          if (user?.role === 'salon') {
            navigateToSection('salon');
          }
          break;
        case 'password_reset':
        case 'admin_message':
          navigateToSection('settings');
          break;
        default:
          break;
      }

      setShowNotifications(false);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleProfileAction = (action: string) => {
    setShowProfile(false);
    
    const dispatchSectionChange = (section: string) => {
      // If already on dashboard, just dispatch the event
      // If not on dashboard, navigate first then dispatch
      if (location.pathname === '/dashboard') {
        const event = new CustomEvent('switchSection', { detail: section });
        window.dispatchEvent(event);
      } else {
        navigate('/dashboard');
        setTimeout(() => {
          const event = new CustomEvent('switchSection', { detail: section });
          window.dispatchEvent(event);
        }, 100);
      }
    };
    
    switch (action) {
      case 'profile':
        dispatchSectionChange('profile');
        break;
      case 'settings':
        dispatchSectionChange('settings');
        break;
      case 'appointments':
        dispatchSectionChange('appointments');
        break;
      case 'favorites':
        dispatchSectionChange('favorites');
        break;
      case 'logout':
        if (window.confirm('Da li ste sigurni da se želite odjaviti?')) {
          logout();
          navigate('/', { replace: true });
        }
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
      case 'appointment_completed':
      case 'appointment_reminder':
        return Calendar;
      case 'new_review':
      case 'review_response':
        return Star;
      case 'favorite_added':
      case 'new_favorite':
        return Heart;
      case 'salon_status_change':
        return MapPin;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return 'text-blue-600 bg-blue-100';
      case 'appointment_confirmed':
        return 'text-green-600 bg-green-100';
      case 'appointment_cancelled':
        return 'text-red-600 bg-red-100';
      case 'appointment_completed':
        return 'text-purple-600 bg-purple-100';
      case 'appointment_reminder':
        return 'text-orange-600 bg-orange-100';
      case 'new_review':
      case 'review_response':
        return 'text-yellow-600 bg-yellow-100';
      case 'favorite_added':
      case 'new_favorite':
        return 'text-pink-600 bg-pink-100';
      case 'salon_status_change':
        return 'text-indigo-600 bg-indigo-100';
      case 'password_reset':
      case 'admin_message':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-blue-600 bg-blue-100';
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

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-45">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            )}
            
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                Dobrodošli, {user?.name} ({getRoleLabel(user?.role || '')})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
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
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-[100] max-h-96 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Obavještenja</h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-600 mt-1">{unreadCount} nepročitanih</p>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
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
                                <p className="text-gray-500 text-xs mt-2">
                                  {notification.created_at_diff}
                                </p>
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
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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

            {/* Direct Logout Button */}
            <button
              onClick={() => {
                if (window.confirm('Da li ste sigurni da se želite odjaviti?')) {
                  logout();
                  navigate('/', { replace: true });
                }
              }}
              className="p-2 rounded-lg hover:bg-red-100 transition-colors"
              title="Odjavi se"
            >
              <LogOut className="w-5 h-5 text-red-600" />
            </button>

            {/* User Avatar */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                {user?.staff_profile?.avatar_url || user?.avatar ? (
                  <img 
                    src={user?.staff_profile?.avatar_url || user?.avatar} 
                    alt={user?.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Profile Menu */}
            <div className="relative profile-dropdown-container">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-[100]"
                >
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
                      <div>
                        <p className="font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <p className="text-xs text-gray-400">{getRoleLabel(user?.role || '')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button 
                      type="button"
                      onClick={() => handleProfileAction('profile')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Uredi profil</span>
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => handleProfileAction('settings')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Podešavanja</span>
                    </button>
                    
                    {user?.role === 'klijent' && (
                      <>
                        <button 
                          type="button"
                          onClick={() => handleProfileAction('appointments')}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">Moji termini</span>
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handleProfileAction('favorites')}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                          <Heart className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">Omiljeni saloni</span>
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleProfileAction('logout')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Odjavi se</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}