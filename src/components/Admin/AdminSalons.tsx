import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Eye, CheckCircle, XCircle, Edit } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { SalonDetailModal } from './AdminModals';

export function AdminSalons() {
  const [salons, setSalons] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedSalon, setSelectedSalon] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadSalons();
  }, [searchTerm, statusFilter]);

  const loadSalons = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await adminAPI.getSalons(params);
      setSalons(response.data || response);
    } catch (error) {
      console.error('Error loading salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSalon = async (salonId: string) => {
    try {
      await adminAPI.approveSalon(salonId);
      loadSalons(); // Refresh list
    } catch (error) {
      console.error('Error approving salon:', error);
    }
  };

  const handleSuspendSalon = async (salonId: string) => {
    if (!window.confirm('Da li ste sigurni da želite da suspenduješ ovaj salon?')) return;
    
    try {
      await adminAPI.suspendSalon(salonId);
      loadSalons(); // Refresh list
    } catch (error) {
      console.error('Error suspending salon:', error);
    }
  };

  // Modal handlers
  const handleViewDetails = (salon: any) => {
    setSelectedSalon(salon);
    setShowDetailModal(true);
  };

  const handleUpdateSalon = async (salonId: string, data: any) => {
    try {
      await adminAPI.updateSalon(salonId, data);
      loadSalons();
    } catch (error) {
      console.error('Error updating salon:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'approved' ? 'bg-green-100 text-green-800' : 
           status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
           'bg-red-100 text-red-800';
  };

  const getStatusText = (status: string) => {
    return status === 'approved' ? 'Odobren' :
           status === 'pending' ? 'Na čekanju' : 'Suspendovan';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Upravljanje salonima</h1>
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Odobri sve pending
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Izvezi izveštaj
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ukupno salona</p>
              <p className="text-2xl font-bold text-gray-900">{salons.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Odobreni</p>
              <p className="text-2xl font-bold text-gray-900">
                {salons.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Na čekanju</p>
              <p className="text-2xl font-bold text-gray-900">
                {salons.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prosečna ocena</p>
              <p className="text-2xl font-bold text-gray-900">
                {salons.length > 0 ? (salons.reduce((sum, s) => sum + (s.rating || 0), 0) / salons.length).toFixed(1) : '0.0'}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pretražite salone po imenu ili gradu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Svi statusi</option>
            <option value="approved">Odobreni</option>
            <option value="pending">Na čekanju</option>
            <option value="suspended">Suspendovani</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-4 h-4" />
            Dodatni filteri
          </button>
        </div>
      </div>

      {/* Salons List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Saloni ({salons.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {salons.map(salon => (
            <div key={salon.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <img
                      src={salon.images && salon.images.length > 0 ? salon.images[0].url : 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg'}
                      alt={salon.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">{salon.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(salon.status)}`}>
                          {getStatusText(salon.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>{salon.address}, {salon.city}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{salon.rating} ({salon.review_count} recenzija)</span>
                        </div>
                        <span>Registrovan: {salon.created_at}</span>
                        <span>Vlasnik: {salon.owner?.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{salon.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span><strong>Email:</strong> {salon.email}</span>
                    <span>•</span>
                    <span><strong>Telefon:</strong> {salon.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <button 
                  onClick={() => handleViewDetails(salon)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Pregled detalja
                </button>
                
                {salon.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleApproveSalon(salon.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Odobri salon
                    </button>
                    <button 
                      onClick={() => handleSuspendSalon(salon.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Odbaci zahtev
                    </button>
                  </>
                )}
                
                {salon.status === 'approved' && (
                  <button 
                    onClick={() => handleSuspendSalon(salon.id)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Suspenduj
                  </button>
                )}
                
                {salon.status === 'suspended' && (
                  <button 
                    onClick={() => handleApproveSalon(salon.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Aktiviraj ponovo
                  </button>
                )}
                
                <button 
                  onClick={() => handleViewDetails(salon)}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Uredi
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {salons.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nema pronađenih salona</h3>
          <p className="text-gray-600">Pokušajte sa drugačijim kriterijumima pretrage</p>
        </div>
      )}

      {/* Salon Detail Modal */}
      <SalonDetailModal
        salon={selectedSalon}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSalon(null);
        }}
        onUpdate={handleUpdateSalon}
        onApprove={handleApproveSalon}
        onSuspend={handleSuspendSalon}
      />
    </div>
  );
}