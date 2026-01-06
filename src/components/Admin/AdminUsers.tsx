import React, { useState, useEffect } from 'react';
import { Search, Filter, User, Users, Crown, Scissors, Plus, Eye, Edit, Mail, Key, Trash2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { UserDetailModal, EditUserModal, AddUserModal, SendMessageModal, ResetPasswordModal } from './AdminModals';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter]);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      
      const response = await adminAPI.getUsers(params);
      setUsers(response.data || response);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'salon': return Users;
      case 'frizer': return Scissors;
      case 'klijent': return User;
      default: return User;
    }
  };

  const getUserRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'salon': return 'Vlasnik salona';
      case 'frizer': return 'Frizer';
      case 'klijent': return 'Klijent';
      default: return role;
    }
  };

  const getUserRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'salon': return 'bg-blue-100 text-blue-800';
      case 'frizer': return 'bg-green-100 text-green-800';
      case 'klijent': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Use stats from server for accurate counts
  const userStats = {
    total: stats?.users?.total ?? 0,
    admin: stats?.users?.admin ?? 0,
    salon: stats?.users?.salon ?? 0,
    frizer: stats?.users?.staff ?? 0,
    klijent: stats?.users?.client ?? 0
  };

  // Modal handlers
  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSendMessage = (user: any) => {
    setSelectedUser(user);
    setShowMessageModal(true);
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleCreateUser = async (data: any) => {
    try {
      await adminAPI.createUser(data);
      loadUsers();
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await adminAPI.updateUser(userId, data);
      loadUsers();
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovog korisnika?')) return;
    try {
      await adminAPI.deleteUser(userId);
      loadUsers();
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleSendMessageSubmit = async (userId: string, title: string, message: string) => {
    try {
      await adminAPI.sendMessageToUser(userId, { title, message });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleResetPasswordSubmit = async (userId: string, sendEmail: boolean) => {
    try {
      await adminAPI.resetUserPassword(userId, { send_email: sendEmail });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Upravljanje korisnicima</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Dodaj korisnika
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            Izvezi korisnike
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-sm font-medium text-gray-600">Ukupno</p>
          <p className="text-xl font-bold text-gray-900">{userStats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-sm font-medium text-purple-600">Admini</p>
          <p className="text-xl font-bold text-purple-900">{userStats.admin}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-sm font-medium text-blue-600">Saloni</p>
          <p className="text-xl font-bold text-blue-900">{userStats.salon}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-sm font-medium text-green-600">Frizeri</p>
          <p className="text-xl font-bold text-green-900">{userStats.frizer}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <p className="text-sm font-medium text-gray-600">Klijenti</p>
          <p className="text-xl font-bold text-gray-900">{userStats.klijent}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pretražite korisnike po imenu ili email-u..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Sve role</option>
            <option value="admin">Administrator</option>
            <option value="salon">Vlasnik salona</option>
            <option value="frizer">Frizer</option>
            <option value="klijent">Klijent</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-4 h-4" />
            Dodatni filteri
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Korisnici ({users.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {users.map(user => {
            const RoleIcon = getUserRoleIcon(user.role);
            
            return (
              <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <RoleIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-lg font-semibold text-gray-900">{user.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserRoleColor(user.role)}`}>
                          {getUserRoleLabel(user.role)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-1">{user.email}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Registrovan: {user.created_at}</span>
                        {user.phone && (
                          <>
                            <span>•</span>
                            <span>Telefon: {user.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <button 
                    onClick={() => handleViewDetails(user)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Pregled detalja
                  </button>
                  
                  <button 
                    onClick={() => handleEdit(user)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Uredi korisnika
                  </button>
                  
                  <button 
                    onClick={() => handleSendMessage(user)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Pošalji poruku
                  </button>
                  
                  <button 
                    onClick={() => handleResetPassword(user)}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Key className="w-4 h-4" />
                    Resetuj lozinku
                  </button>
                  
                  {user.role !== 'admin' && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Obriši
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nema pronađenih korisnika</h3>
          <p className="text-gray-600">Pokušajte sa drugačijim kriterijumima pretrage</p>
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedUser(null);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSave={handleUpdateUser}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateUser}
      />

      {/* Send Message Modal */}
      <SendMessageModal
        user={selectedUser}
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedUser(null);
        }}
        onSend={handleSendMessageSubmit}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        user={selectedUser}
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setSelectedUser(null);
        }}
        onReset={handleResetPasswordSubmit}
      />
    </div>
  );
}