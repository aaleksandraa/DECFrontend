import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, Eye, Edit, Send, Key } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Salon Detail Modal
interface SalonDetailModalProps extends ModalProps {
  salon: any;
  onApprove?: (id: string) => void;
  onSuspend?: (id: string) => void;
}

export function SalonDetailModal({ isOpen, onClose, salon, onApprove, onSuspend }: SalonDetailModalProps) {
  if (!isOpen || !salon) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Detalji salona</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Osnovne informacije</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Naziv:</span>
                <p className="font-medium">{salon.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className={`font-medium ${
                  salon.status === 'approved' ? 'text-green-600' :
                  salon.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {salon.status === 'approved' ? 'Odobren' :
                   salon.status === 'pending' ? 'Na čekanju' : 'Suspendovan'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Grad:</span>
                <p className="font-medium">{salon.city}</p>
              </div>
              <div>
                <span className="text-gray-600">Adresa:</span>
                <p className="font-medium">{salon.address}</p>
              </div>
              <div>
                <span className="text-gray-600">Telefon:</span>
                <p className="font-medium">{salon.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">{salon.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Ocjena:</span>
                <p className="font-medium">{salon.rating || 0}/5 ({salon.review_count || 0} recenzija)</p>
              </div>
              <div>
                <span className="text-gray-600">Registrovan:</span>
                <p className="font-medium">{salon.created_at}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Opis</h3>
            <p className="text-gray-600 text-sm">{salon.description}</p>
          </div>

          {/* Owner */}
          {salon.owner && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Vlasnik</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{salon.owner.name}</p>
                <p className="text-sm text-gray-600">{salon.owner.email}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {salon.status === 'pending' && onApprove && (
              <button
                onClick={() => { onApprove(salon.id); onClose(); }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Odobri salon
              </button>
            )}
            {salon.status !== 'suspended' && onSuspend && (
              <button
                onClick={() => { onSuspend(salon.id); onClose(); }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Suspenduj
              </button>
            )}
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Detail Modal
interface UserDetailModalProps extends ModalProps {
  user: any;
}

export function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  if (!isOpen || !user) return null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'salon': return 'Vlasnik salona';
      case 'frizer': return 'Frizer';
      case 'klijent': return 'Klijent';
      default: return role;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Detalji korisnika</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{user.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Uloga:</span>
              <p className="font-medium">{getRoleLabel(user.role)}</p>
            </div>
            <div>
              <span className="text-gray-600">Telefon:</span>
              <p className="font-medium">{user.phone || 'Nije unesen'}</p>
            </div>
            <div>
              <span className="text-gray-600">Registrovan:</span>
              <p className="font-medium">{user.created_at}</p>
            </div>
            <div>
              <span className="text-gray-600">Email verifikovan:</span>
              <p className="font-medium">{user.email_verified_at ? 'Da' : 'Ne'}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit User Modal
interface EditUserModalProps extends ModalProps {
  user: any;
  onSave: (id: string, data: any) => Promise<void>;
}

export function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'klijent'
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.id, formData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Uredi korisnika</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ime</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uloga</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="klijent">Klijent</option>
              <option value="salon">Vlasnik salona</option>
              <option value="frizer">Frizer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
              Otkaži
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add User Modal
interface AddUserModalProps extends ModalProps {
  onSave: (data: any) => Promise<void>;
}

export function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'klijent'
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'klijent' });
      onClose();
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Dodaj korisnika</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ime *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lozinka *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uloga</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="klijent">Klijent</option>
              <option value="salon">Vlasnik salona</option>
              <option value="frizer">Frizer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.email || !formData.password}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Dodavanje...' : 'Dodaj korisnika'}
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
              Otkaži
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Send Message Modal
interface SendMessageModalProps extends ModalProps {
  user: any;
  onSend: (userId: string, message: string) => Promise<void>;
}

export function SendMessageModal({ isOpen, onClose, user, onSend }: SendMessageModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen || !user) return null;

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await onSend(user.id, message);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Pošalji poruku</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Primatelj:</p>
            <p className="font-medium">{user.name} ({user.email})</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poruka</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Unesite poruku..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Slanje...' : 'Pošalji'}
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
              Otkaži
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reset Password Modal
interface ResetPasswordModalProps extends ModalProps {
  user: any;
  onReset: (userId: string) => Promise<void>;
}

export function ResetPasswordModal({ isOpen, onClose, user, onReset }: ResetPasswordModalProps) {
  const [resetting, setResetting] = useState(false);

  if (!isOpen || !user) return null;

  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset(user.id);
      onClose();
    } catch (error) {
      console.error('Error resetting password:', error);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Resetuj lozinku</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              Da li ste sigurni da želite resetovati lozinku za korisnika <strong>{user.name}</strong>?
            </p>
            <p className="text-sm text-yellow-600 mt-2">
              Nova lozinka će biti poslana na email: {user.email}
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              {resetting ? 'Resetovanje...' : 'Resetuj lozinku'}
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
              Otkaži
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
