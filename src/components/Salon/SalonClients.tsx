import { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  EnvelopeIcon, 
  UserIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { Toast, ToastType } from '../Common/Toast';
import { AutoSaveIndicator } from '../Common/AutoSaveIndicator';
import { useFormStore } from '../../store/formStore';
import { useAutoSave } from '../../hooks/useAutoSave';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  total_appointments: number;
  completed_appointments: number;
  last_visit: string | null;
  total_spent: number;
  member_since: string;
}

interface ClientDetails {
  client: {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    created_at: string;
  };
  stats: {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    total_spent: number;
  };
  appointments: Array<{
    id: number;
    date: string;
    time: string;
    status: string;
    total_price: number;
    services: string[];
    staff: string | null;
    notes: string | null;
  }>;
}

export function SalonClients() {
  // Zustand store for persistence
  const {
    emailForm,
    setEmailForm,
    clearEmailForm,
    searchQuery,
    setSearchQuery,
    lastVisitFilter: storedLastVisitFilter,
    setLastVisitFilter: setStoredLastVisitFilter,
  } = useFormStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Use persisted values
  const search = searchQuery;
  const setSearch = setSearchQuery;
  const lastVisitFilter = storedLastVisitFilter;
  const setLastVisitFilter = setStoredLastVisitFilter;
  const selectedClients = emailForm.selectedClients;
  const emailSubject = emailForm.subject;
  const emailMessage = emailForm.message;

  // Update functions that sync with store
  const setSelectedClients = (clients: number[] | ((prev: number[]) => number[])) => {
    const newClients = typeof clients === 'function' ? clients(emailForm.selectedClients) : clients;
    setEmailForm({ selectedClients: newClients });
  };

  const setEmailSubject = (subject: string) => {
    setEmailForm({ subject });
  };

  const setEmailMessage = (message: string) => {
    setEmailForm({ message });
  };

  // Auto-save callback
  const handleAutoSave = useCallback(() => {
    setAutoSaveStatus('saving');
    // Simulate save delay
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      // Reset to idle after 3 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }, 300);
  }, []);

  // Auto-save email form data
  useAutoSave(handleAutoSave, { emailSubject, emailMessage, selectedClients }, 800);

  useEffect(() => {
    fetchClients();
  }, [search]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients', {
        params: { search }
      });
      setClients(response.data.clients || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      
      // Show user-friendly error message
      if (error?.response?.status === 401) {
        setToast({ 
          message: 'Sesija je istekla. Molimo prijavite se ponovo.', 
          type: 'error' 
        });
      } else if (error?.response?.status === 403) {
        setToast({ 
          message: 'Nemate dozvolu za pristup klijentima.', 
          type: 'error' 
        });
      } else if (error?.response?.status === 404) {
        setToast({ 
          message: 'Ruta za klijente nije pronađena. Kontaktirajte podršku.', 
          type: 'error' 
        });
      } else {
        setToast({ 
          message: 'Greška pri učitavanju klijenata. Pokušajte ponovo.', 
          type: 'error' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: number) => {
    try {
      const response = await api.get(`/clients/${clientId}`);
      setSelectedClient(response.data);
      setShowClientDetails(true);
    } catch (error) {
      console.error('Error fetching client details:', error);
    }
  };

  const toggleClientSelection = (clientId: number) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    const filteredClientIds = filteredClients.map(c => c.id);
    const allSelected = filteredClientIds.every(id => selectedClients.includes(id));
    
    if (allSelected) {
      // Deselect all filtered clients
      setSelectedClients(prev => prev.filter(id => !filteredClientIds.includes(id)));
    } else {
      // Select all filtered clients
      setSelectedClients(prev => [...new Set([...prev, ...filteredClientIds])]);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage || selectedClients.length === 0) {
      showToast('Molimo popunite sve podatke', 'warning');
      return;
    }

    try {
      setSendingEmail(true);
      await api.post('/clients/send-email', {
        client_ids: selectedClients,
        subject: emailSubject,
        message: emailMessage
      });
      showToast(`Email uspješno poslat na ${selectedClients.length} klijenata`, 'success');
      setShowEmailModal(false);
      // Clear form after successful send
      clearEmailForm();
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Greška prilikom slanja email-a', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nikad';
    return new Date(dateString).toLocaleDateString('hr-HR');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} KM`;
  };

  const filterClientsByLastVisit = (clients: Client[]) => {
    if (lastVisitFilter === 'all') return clients;

    const now = new Date();
    return clients.filter(client => {
      if (!client.last_visit) return false;
      const lastVisit = new Date(client.last_visit);
      const daysDiff = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      switch (lastVisitFilter) {
        case 'week':
          return daysDiff <= 7;
        case 'month':
          return daysDiff <= 30;
        case '3months':
          return daysDiff <= 90;
        case '6months':
          return daysDiff <= 180;
        case 'year':
          return daysDiff <= 365;
        default:
          return true;
      }
    });
  };

  const filteredClients = filterClientsByLastVisit(clients);

  const sendEmailToClient = (clientId: number) => {
    setSelectedClients([clientId]);
    setShowEmailModal(true);
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Klijenti</h2>
          <p className="text-gray-600 mt-1">Upravljajte vašim klijentima i šaljite im poruke</p>
        </div>
        {selectedClients.length > 0 && (
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <EnvelopeIcon className="h-5 w-5" />
            Pošalji email ({selectedClients.length})
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraži po imenu, email-u ili telefonu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <select
              value={lastVisitFilter}
              onChange={(e) => setLastVisitFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">Svi klijenti</option>
              <option value="week">Posljednjih 7 dana</option>
              <option value="month">Posljednjih 30 dana</option>
              <option value="3months">Posljednjih 3 mjeseca</option>
              <option value="6months">Posljednjih 6 mjeseci</option>
              <option value="year">Posljednja godina</option>
            </select>
            <button
              onClick={selectAllClients}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {selectedClients.length === filteredClients.length ? 'Poništi sve' : 'Označi sve'}
            </button>
          </div>
          {lastVisitFilter !== 'all' && (
            <div className="text-sm text-gray-600">
              Prikazano {filteredClients.length} od {clients.length} klijenata
            </div>
          )}
        </div>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {lastVisitFilter !== 'all' ? 'Nema klijenata koji odgovaraju filteru' : 'Nema klijenata'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredClients.length > 0 && filteredClients.every(c => selectedClients.includes(c.id))}
                      onChange={selectAllClients}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klijent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Termini
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posljednja posjeta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ukupno potrošeno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => toggleClientSelection(client.id)}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {client.avatar ? (
                          <img src={client.avatar} alt={client.name} className="h-10 w-10 rounded-full" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-pink-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{client.name}</p>
                          <p className="text-sm text-gray-500">Član od {formatDate(client.member_since)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{client.total_appointments}</span>
                        <span className="text-sm text-gray-500">
                          ({client.completed_appointments} završeno)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(client.last_visit)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-gray-900">{formatCurrency(client.total_spent)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fetchClientDetails(client.id)}
                          className="text-pink-600 hover:text-pink-700 font-medium text-sm"
                        >
                          Detalji
                        </button>
                        <button
                          onClick={() => sendEmailToClient(client.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                          title="Pošalji email"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                          Email
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-gray-900">
                  Pošalji email ({selectedClients.length} klijenata)
                </h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naslov
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Unesite naslov email-a"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poruka
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Unesite poruku..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
                {sendingEmail ? 'Šaljem...' : 'Pošalji'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Detalji klijenta
              </h3>
              <button
                onClick={() => setShowClientDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div className="flex items-center gap-4">
                {selectedClient.client.avatar ? (
                  <img src={selectedClient.client.avatar} alt={selectedClient.client.name} className="h-16 w-16 rounded-full" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-pink-600" />
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{selectedClient.client.name}</h4>
                  <p className="text-gray-600">{selectedClient.client.email}</p>
                  {selectedClient.client.phone && (
                    <p className="text-gray-600">{selectedClient.client.phone}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Ukupno termina</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedClient.stats.total_appointments}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Završeno</p>
                  <p className="text-2xl font-bold text-green-900">{selectedClient.stats.completed_appointments}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Otkazano</p>
                  <p className="text-2xl font-bold text-red-900">{selectedClient.stats.cancelled_appointments}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Ukupno potrošeno</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(selectedClient.stats.total_spent)}</p>
                </div>
              </div>

              {/* Appointments History */}
              <div>
                <h5 className="text-lg font-bold text-gray-900 mb-4">Istorija termina</h5>
                <div className="space-y-3">
                  {selectedClient.appointments
                    .sort((a, b) => {
                      // Sort by date descending (newest first)
                      const dateA = new Date(a.date.split('.').reverse().join('-'));
                      const dateB = new Date(b.date.split('.').reverse().join('-'));
                      
                      if (dateA.getTime() !== dateB.getTime()) {
                        return dateB.getTime() - dateA.getTime();
                      }
                      
                      // If same date, sort by time descending
                      return b.time.localeCompare(a.time);
                    })
                    .map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(appointment.date)} u {appointment.time}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.services.join(', ')}
                          </p>
                          {appointment.staff && (
                            <p className="text-sm text-gray-500">Radnik: {appointment.staff}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status === 'completed' ? 'Završeno' :
                             appointment.status === 'confirmed' ? 'Potvrđeno' :
                             appointment.status === 'cancelled' ? 'Otkazano' :
                             appointment.status}
                          </span>
                          <p className="font-bold text-gray-900 mt-1">{formatCurrency(appointment.total_price)}</p>
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">Napomena: {appointment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
