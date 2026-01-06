import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  MapPin,
  DollarSign,
  Star
} from 'lucide-react';
import { adminAPI } from '../../services/api';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Greška pri učitavanju podataka</p>
      </div>
    );
  }

  const platformStats = [
    {
      label: 'Ukupno salona',
      value: stats.salons.total.toString(),
      change: `${stats.salons.pending} pending`,
      changeType: 'neutral' as const,
      icon: MapPin,
      color: 'blue'
    },
    {
      label: 'Aktivni korisnici',
      value: stats.users.total.toString(),
      change: `${stats.users.client} klijenata`,
      changeType: 'positive' as const,
      icon: Users,
      color: 'green'
    },
    {
      label: 'Ukupno termina',
      value: stats.appointments.total.toString(),
      change: `${stats.appointments.completed} završeno`,
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'purple'
    },
    {
      label: 'Prihod platforme',
      value: `${stats.revenue.platform.toFixed(2)} KM`,
      change: '10% komisija',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
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
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
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
        {/* Salon Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Status salona</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Odobreni saloni</h4>
                    <p className="text-sm text-gray-600">Aktivni na platformi</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.salons.approved}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Na čekanju</h4>
                    <p className="text-sm text-gray-600">Čekaju odobrenje</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{stats.salons.pending}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Suspendovani</h4>
                    <p className="text-sm text-gray-600">Privremeno neaktivni</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.salons.suspended}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Types Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Tipovi korisnika</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Klijenti</h4>
                    <p className="text-sm text-gray-600">Korisnici koji rezervišu</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{stats.users.client}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Vlasnici salona</h4>
                    <p className="text-sm text-gray-600">Upravljaju salonima</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{stats.users.salon}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Frizeri</h4>
                    <p className="text-sm text-gray-600">Pružaju usluge</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.users.staff}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Brze akcije</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <MapPin className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Odobri salona</h4>
            <p className="text-sm text-gray-600">Pregled pending registracija</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Users className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Upravljaj korisnicima</h4>
            <p className="text-sm text-gray-600">Dodaj ili ukloni korisnike</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Pogledaj analitiku</h4>
            <p className="text-sm text-gray-600">Detaljni izvještaji performansi</p>
          </button>
        </div>
      </div>
    </div>
  );
}