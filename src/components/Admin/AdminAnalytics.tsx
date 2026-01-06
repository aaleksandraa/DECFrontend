import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  MapPin,
  Star,
  Clock,
  Activity
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics({ period });
      setAnalytics(response);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Greška pri učitavanju analitike</p>
      </div>
    );
  }

  // Safe arrays with defaults
  const revenueData = Array.isArray(analytics.revenue) ? analytics.revenue : [];
  const newUsersData = Array.isArray(analytics.new_users) ? analytics.new_users : [];
  const appointmentsData = Array.isArray(analytics.appointments) ? analytics.appointments : [];
  const newSalonsData = Array.isArray(analytics.new_salons) ? analytics.new_salons : [];
  const topCitiesData = Array.isArray(analytics.top_cities) ? analytics.top_cities : [];

  // Calculate totals safely
  const totalRevenue = revenueData.reduce((sum: number, r: any) => sum + (Number(r.platform) || 0), 0);
  const totalUsers = newUsersData.reduce((sum: number, u: any) => sum + (Number(u.count) || 0), 0);
  const totalAppointments = appointmentsData.reduce((sum: number, a: any) => sum + (Number(a.count) || 0), 0);
  const totalSalons = newSalonsData.reduce((sum: number, s: any) => sum + (Number(s.count) || 0), 0);

  const platformStats = [
    {
      label: 'Ukupan prihod platforme',
      value: `${totalRevenue.toFixed(2)} KM`,
      change: '+22%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'green'
    },
    {
      label: 'Aktivni korisnici',
      value: totalUsers.toString(),
      change: '+18%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Ukupno termina',
      value: totalAppointments.toString(),
      change: '+24%',
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'purple'
    },
    {
      label: 'Registrovani saloni',
      value: totalSalons.toString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: MapPin,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analitika platforme</h1>
        <div className="flex gap-2">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="day">Danas</option>
            <option value="week">Ova sedmica</option>
            <option value="month">Ovaj mesec</option>
            <option value="year">Ova godina</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Izvezi izveštaj
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {platformStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">vs prošli period</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cities */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top gradovi</h3>
            <p className="text-sm text-gray-600">Po broju salona</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topCitiesData.map((city: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{city.city}</h4>
                      <p className="text-sm text-gray-600">{city.salon_count} salona</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Rast korisnika</h3>
            <p className="text-sm text-gray-600">Za izabrani period</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 h-48">
              {newUsersData.length > 0 ? newUsersData.map((data: any, index: number) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="flex-1 flex flex-col justify-end w-full">
                    <div 
                      className="bg-blue-500 rounded-t"
                      style={{ height: `${Math.max((data.count / Math.max(...newUsersData.map((u: any) => u.count), 1)) * 100, 5)}%` }}
                      title={`${data.count} korisnika`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{data.date}</span>
                </div>
              )) : <p className="text-gray-500 col-span-7 text-center">Nema podataka</p>}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Novi korisnici</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Prihod platforme</h3>
          <p className="text-sm text-gray-600">Komisija od završenih termina</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 h-48">
            {revenueData.length > 0 ? revenueData.map((data: any, index: number) => {
              const platformValue = Number(data.platform) || 0;
              const maxPlatform = Math.max(...revenueData.map((r: any) => Number(r.platform) || 0), 1);
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="flex-1 flex flex-col justify-end w-full">
                    <div 
                      className="bg-green-500 rounded-t"
                      style={{ height: `${Math.max((platformValue / maxPlatform) * 100, 5)}%` }}
                      title={`${platformValue.toFixed(2)} KM prihod`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{data.date}</span>
                </div>
              );
            }) : <p className="text-gray-500 col-span-7 text-center">Nema podataka</p>}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Prihod platforme (10%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}