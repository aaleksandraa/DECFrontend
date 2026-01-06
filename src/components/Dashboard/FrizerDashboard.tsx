import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  DollarSign,
  User,
  Star,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Plus,
  Edit,
  Save,
  X,
  Download,
  FileText,
  BarChart3,
  Phone,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentDateEuropean, formatDateEuropean, formatTime24 } from '../../utils/dateUtils';
import { appointmentAPI, staffAPI } from '../../services/api';
import { FrizerReportModal } from '../Frizer/FrizerReportModal';
import { StaffRole, StaffRoleLabels } from '../../types';

type PeriodOption = 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

export function FrizerDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getCurrentDateEuropean());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Period selection for analytics
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('this_month');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load staff profile
      if (user.staff_profile) {
        const staffData = await staffAPI.getStaffMember(user.staff_profile.salon_id, user.staff_profile.id);
        setStaff(staffData);
        
        // Load appointments for this staff member
        const appointmentsData = await staffAPI.getAppointments(user.staff_profile.salon_id, user.staff_profile.id);
        // Handle different response formats
        const appointmentsArray = appointmentsData?.appointments || appointmentsData?.data || appointmentsData || [];
        setAppointments(Array.isArray(appointmentsArray) ? appointmentsArray : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayAppointments = appointments
    .filter(app => app.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time)); // Sort by time ascending for daily view
  const upcomingAppointments = appointments.filter(app => app.date >= getCurrentDateEuropean() && app.status === 'confirmed');
  
  // Date range functions for analytics
  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const parseAppointmentDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    return new Date(year, month - 1, day);
  };

  const getDateRange = useCallback((): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedPeriod) {
      case 'this_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          label: 'Ovaj mjesec'
        };
      case 'last_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0),
          label: 'Prošli mjesec'
        };
      case 'this_year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
          label: 'Ova godina'
        };
      case 'last_year':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31),
          label: 'Prošla godina'
        };
      case 'custom':
        if (customDateStart && customDateEnd) {
          return {
            start: new Date(customDateStart),
            end: new Date(customDateEnd),
            label: `${formatDateShort(new Date(customDateStart))} - ${formatDateShort(new Date(customDateEnd))}`
          };
        }
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: today,
          label: 'Ovaj mjesec'
        };
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: today,
          label: 'Ovaj mjesec'
        };
    }
  }, [selectedPeriod, customDateStart, customDateEnd]);

  const filterAppointmentsByDateRange = useCallback((apps: any[], range: DateRange) => {
    return apps.filter((app: any) => {
      const appDate = parseAppointmentDate(app.date);
      if (!appDate) return false;
      return appDate >= range.start && appDate <= range.end;
    });
  }, []);

  const filteredAppointments = useMemo(() => {
    const range = getDateRange();
    return filterAppointmentsByDateRange(appointments, range);
  }, [appointments, selectedPeriod, customDateStart, customDateEnd, getDateRange, filterAppointmentsByDateRange]);

  const thisMonthAppointments = appointments.filter(app => {
    const [day, month, year] = app.date.split('.');
    const [currentDay, currentMonth, currentYear] = getCurrentDateEuropean().split('.');
    return month === currentMonth && year === currentYear && app.status !== 'cancelled';
  });

  const completedThisMonth = thisMonthAppointments.filter(app => app.status === 'completed');
  const totalRevenue = completedThisMonth.reduce((sum, app) => sum + app.total_price, 0);

  const stats = [
    {
      label: 'Danas termini',
      value: todayAppointments.length.toString(),
      subtitle: `${todayAppointments.filter(a => a.status === 'completed').length} završeno`,
      icon: Calendar,
      color: 'blue'
    },
    {
      label: 'Ovaj mjesec',
      value: thisMonthAppointments.length.toString(),
      subtitle: `${Math.round((thisMonthAppointments.length / 30) * 100)}% rast`,
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Prihod ove sedmice',
      value: `${Math.round(totalRevenue)} KM`,
      subtitle: 'završeni termini',
      icon: DollarSign,
      color: 'purple'
    },
    {
      label: 'Moja ocjena',
      value: staff?.rating?.toFixed(1) || '0.0',
      subtitle: `${staff?.review_count || 0} recenzije`,
      icon: Star,
      color: 'yellow'
    }
  ];

  const handleAppointmentAction = async (appointmentId: string, action: 'start' | 'complete' | 'cancel') => {
    try {
      let newStatus: string;
      switch (action) {
        case 'start':
          newStatus = 'in_progress';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
        default:
          return;
      }

      await appointmentAPI.updateAppointment(appointmentId, { status: newStatus });
      
      // Refresh appointments
      loadData();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'in_progress': return 'U toku';
      case 'confirmed': return 'Potvrđen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profil nije pronađen</h3>
        <p className="text-gray-600">Kontaktirajte administratora salona da vam kreira profil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex overflow-x-auto space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Calendar },
            { id: 'calendar', label: 'Kalendar', icon: Calendar },
            { id: 'analytics', label: 'Analitika', icon: TrendingUp },
            { id: 'profile', label: 'Profil', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1 truncate">{stat.subtitle}</p>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100 flex-shrink-0`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Moj raspored</h3>
                    <p className="text-sm text-gray-600">
                      {selectedDate} - {new Date(selectedDate.split('.').reverse().join('-')).toLocaleDateString('bs-BA', { weekday: 'long' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={selectedDate.split('.').reverse().join('-')}
                      onChange={(e) => setSelectedDate(formatDateEuropean(new Date(e.target.value)))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {todayAppointments.length > 0 ? (
                    todayAppointments.map((appointment) => (
                      <div key={appointment.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="text-center min-w-[60px]">
                              <div className="text-lg font-bold text-gray-900">{appointment.time}</div>
                              <div className="text-xs text-gray-500">{appointment.end_time}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">{appointment.client_name}</h4>
                                {appointment.is_guest && (
                                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0">Ručno</span>
                                )}
                              </div>
                              
                              {/* Phone - Clickable */}
                              {appointment.client_phone && (
                                <a 
                                  href={`tel:${appointment.client_phone}`}
                                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 hover:underline mb-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  {appointment.client_phone}
                                </a>
                              )}
                              
                              <p className="text-sm text-gray-600 truncate">{appointment.service?.name}</p>
                              <p className="text-xs text-gray-500">{appointment.total_price} KM • {appointment.service?.duration || 0} min</p>
                              
                              {/* Notes */}
                              {appointment.notes && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <div className="flex items-start gap-1">
                                    <MessageSquare className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-yellow-800">{appointment.notes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {getStatusText(appointment.status)}
                            </span>
                            
                            {appointment.status === 'confirmed' && (
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'start')}
                                className="text-blue-600 hover:text-blue-700 p-1"
                                title="Počni termin"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            
                            {appointment.status === 'in_progress' && (
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="Završi termin"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            
                            {(appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                                className="text-red-600 hover:text-red-700 p-1"
                                title="Otkaži termin"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Nema termina za izabrani datum</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Moj profil</h3>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('switchSection', { detail: 'settings' }))}
                    className="text-blue-600 hover:text-blue-700 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    {staff.avatar_url || user?.staff_profile?.avatar_url ? (
                      <img 
                        src={staff.avatar_url || user?.staff_profile?.avatar_url} 
                        alt={staff.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900">{staff.name}</h4>
                  <p className="text-sm text-gray-600">{StaffRoleLabels[staff.role as StaffRole] || staff.role}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{staff.rating}</span>
                    <span className="text-xs text-gray-500">({staff.review_count})</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Specijalnosti:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {staff.specialties?.map((specialty: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {staff.bio && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">O meni:</span>
                      <p className="text-sm text-gray-900 mt-1">{staff.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kalendar termina</h3>
          <div className="text-center py-12 text-gray-500">
            Kalendar funkcionalnost će biti implementirana
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header with Period Selector and Export Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Analitika performansi</h2>
              <p className="text-gray-600">Period: {getDateRange().label}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Period Selection */}
              <div className="relative">
                <select 
                  value={selectedPeriod === 'custom' ? 'custom' : selectedPeriod}
                  onChange={(e) => {
                    const value = e.target.value as PeriodOption;
                    if (value === 'custom') {
                      setShowCustomPicker(true);
                    } else {
                      setSelectedPeriod(value);
                      setShowCustomPicker(false);
                    }
                  }}
                  className="appearance-none bg-white px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                >
                  <option value="this_month">Ovaj mjesec</option>
                  <option value="last_month">Prošli mjesec</option>
                  <option value="this_year">Ova godina</option>
                  <option value="last_year">Prošla godina</option>
                  <option value="custom">Prilagođeno...</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Izvezi izvještaj
              </button>
            </div>
          </div>

          {/* Custom Date Picker Modal */}
          {showCustomPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Odaberite period</h3>
                  <button onClick={() => setShowCustomPicker(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Od datuma</label>
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Do datuma</label>
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const now = new Date();
                        setCustomDateStart(new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]);
                        setCustomDateEnd(now.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      Zadnja 3 mjeseca
                    </button>
                    <button
                      onClick={() => {
                        const now = new Date();
                        setCustomDateStart(new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0]);
                        setCustomDateEnd(now.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      Zadnjih 6 mjeseci
                    </button>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setShowCustomPicker(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Otkaži
                    </button>
                    <button
                      onClick={() => {
                        if (customDateStart && customDateEnd) {
                          setSelectedPeriod('custom');
                          setShowCustomPicker(false);
                        }
                      }}
                      disabled={!customDateStart || !customDateEnd}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Primijeni
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Stats - using filtered data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ukupno termina</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredAppointments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Završeno</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredAppointments.filter(a => a.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ukupan prihod</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {filteredAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.total_price || 0), 0).toFixed(0)} KM
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prosječna ocjena</p>
                  <p className="text-2xl font-bold text-yellow-600">{staff?.rating?.toFixed(1) || '0.0'}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Chart - using filtered data */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pregled za period: {getDateRange().label}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointments by Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Termini po statusu</h4>
                <div className="space-y-3">
                  {[
                    { status: 'completed', label: 'Završeno', color: 'bg-green-500' },
                    { status: 'confirmed', label: 'Potvrđeno', color: 'bg-orange-500' },
                    { status: 'pending', label: 'Na čekanju', color: 'bg-blue-500' },
                    { status: 'cancelled', label: 'Otkazano', color: 'bg-red-500' },
                  ].map(item => {
                    const count = filteredAppointments.filter(a => a.status === item.status).length;
                    const percentage = filteredAppointments.length > 0 ? (count / filteredAppointments.length) * 100 : 0;
                    return (
                      <div key={item.status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Brza statistika</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Stopa završenosti</span>
                    <span className="font-bold text-green-600">
                      {filteredAppointments.length > 0 
                        ? Math.round((filteredAppointments.filter(a => a.status === 'completed').length / filteredAppointments.length) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Prosječna cijena</span>
                    <span className="font-bold text-purple-600">
                      {filteredAppointments.filter(a => a.status === 'completed').length > 0
                        ? (filteredAppointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.total_price || 0), 0) / 
                           filteredAppointments.filter(a => a.status === 'completed').length).toFixed(2)
                        : '0.00'} KM
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Broj recenzija</span>
                    <span className="font-bold text-yellow-600">{staff?.review_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Stopa otkazivanja</span>
                    <span className="font-bold text-red-600">
                      {filteredAppointments.length > 0 
                        ? Math.round((filteredAppointments.filter(a => a.status === 'cancelled').length / filteredAppointments.length) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900">Izvoz izvještaja</h4>
              <p className="text-sm text-orange-700">
                Kliknite na "Izvezi izvještaj" da biste generisali PDF dokument sa detaljnom statistikom 
                za odabrani period. Možete odabrati koje informacije želite uključiti.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Moj profil</h3>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('switchSection', { detail: 'settings' }))}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Uredi profil
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Osnovne informacije</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Ime:</strong> {staff.name}</div>
                <div><strong>Pozicija:</strong> {StaffRoleLabels[staff.role as StaffRole] || staff.role}</div>
                <div><strong>Ocjena:</strong> {staff.rating} ({staff.review_count} recenzija)</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Specijalnosti</h4>
              <div className="flex flex-wrap gap-1">
                {staff.specialties?.map((specialty: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {staff.bio && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Biografija</h4>
              <p className="text-gray-600">{staff.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      <FrizerReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        staff={staff}
        appointments={appointments}
      />
    </div>
  );
}