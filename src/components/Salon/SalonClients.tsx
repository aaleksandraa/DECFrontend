import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  UserIcon,
  XMarkIcon,
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
  member_since: string | null;
}

interface StaffOption {
  id: number;
  name: string;
}

interface ServiceOption {
  id: number;
  name: string;
  category?: string | null;
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

type LastVisitFilter = 'all' | 'week' | 'month' | '3months' | '6months' | 'year';

export function SalonClients() {
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
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const search = searchQuery;
  const setSearch = setSearchQuery;
  const lastVisitFilter = (storedLastVisitFilter as LastVisitFilter) || 'all';
  const setLastVisitFilter = (value: string) => setStoredLastVisitFilter(value);
  const selectedClients = emailForm.selectedClients;
  const emailSubject = emailForm.subject;
  const emailMessage = emailForm.message;

  const setSelectedClients = (value: number[] | ((prev: number[]) => number[])) => {
    const newValue = typeof value === 'function' ? value(emailForm.selectedClients) : value;
    setEmailForm({ selectedClients: newValue });
  };

  const setEmailSubject = (subject: string) => setEmailForm({ subject });
  const setEmailMessage = (message: string) => setEmailForm({ message });

  const handleAutoSave = useCallback(() => {
    setAutoSaveStatus('saving');
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    }, 250);
  }, []);

  useAutoSave(handleAutoSave, { emailSubject, emailMessage, selectedClients }, 800);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients', {
        params: {
          search,
          per_page: 500,
          last_visit_filter: lastVisitFilter,
          staff_ids: selectedStaffId === 'all' ? [] : [Number(selectedStaffId)],
          service_ids: selectedServiceId === 'all' ? [] : [Number(selectedServiceId)],
          service_categories: selectedCategory === 'all' ? [] : [selectedCategory],
        },
      });

      const data = response.data || {};
      setClients(data.clients || []);
      setTotalClients(data.total || 0);
      setStaffOptions(data.filters?.staff || []);
      setServiceOptions(data.filters?.services || []);
      setCategoryOptions(data.filters?.categories || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);

      if (error?.response?.status === 401) {
        setToast({ message: 'Sesija je istekla. Prijavite se ponovo.', type: 'error' });
      } else if (error?.response?.status === 403) {
        setToast({ message: 'Nemate dozvolu za pristup klijentima.', type: 'error' });
      } else {
        setToast({ message: 'Greska pri ucitavanju klijenata.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, [lastVisitFilter, search, selectedCategory, selectedServiceId, selectedStaffId]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const fetchClientDetails = async (clientId: number) => {
    try {
      const response = await api.get(`/clients/${clientId}`);
      setSelectedClient(response.data);
      setShowClientDetails(true);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setToast({ message: 'Greska pri ucitavanju detalja klijenta.', type: 'error' });
    }
  };

  const toggleClientSelection = (clientId: number) => {
    setSelectedClients((prev) => (prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]));
  };

  const selectAllVisibleClients = () => {
    const visibleIds = clients.map((client) => client.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedClients.includes(id));

    if (allVisibleSelected) {
      setSelectedClients((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedClients((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim() || selectedClients.length === 0) {
      setToast({ message: 'Unesite naslov, poruku i izaberite klijente.', type: 'warning' });
      return;
    }

    try {
      setSendingEmail(true);
      const response = await api.post('/clients/send-email', {
        client_ids: selectedClients,
        subject: emailSubject,
        message: emailMessage,
      });

      const sent = response.data?.sent ?? 0;
      const failed = response.data?.failed ?? 0;
      const skippedNotClient = response.data?.skipped_not_client ?? 0;
      const skippedMissingEmail = response.data?.skipped_missing_email ?? 0;
      const skipped = skippedNotClient + skippedMissingEmail;

      setToast({
        message: `Email poslato: ${sent}, neuspjelo: ${failed}, preskoceno: ${skipped}.`,
        type: 'success',
      });

      setShowEmailModal(false);
      clearEmailForm();
    } catch (error) {
      console.error('Error sending email:', error);
      setToast({ message: 'Greska pri slanju email-a.', type: 'error' });
    } finally {
      setSendingEmail(false);
    }
  };

  const sendEmailToClient = (clientId: number) => {
    setSelectedClients([clientId]);
    setShowEmailModal(true);
  };

  const clearAdvancedFilters = () => {
    setSelectedStaffId('all');
    setSelectedServiceId('all');
    setSelectedCategory('all');
    setLastVisitFilter('all');
  };

  const allVisibleSelected = clients.length > 0 && clients.every((client) => selectedClients.includes(client.id));
  const hasAdvancedFilters =
    selectedStaffId !== 'all' ||
    selectedServiceId !== 'all' ||
    selectedCategory !== 'all' ||
    lastVisitFilter !== 'all';
  const activeFilterCount = [
    selectedStaffId !== 'all',
    selectedServiceId !== 'all',
    selectedCategory !== 'all',
    lastVisitFilter !== 'all',
  ].filter(Boolean).length;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nikad';
    return new Date(dateString).toLocaleDateString('sr-Latn-RS');
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} KM`;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Klijenti</h2>
            <p className="text-gray-600 mt-1">Filtrirajte klijente i saljite personalizovane email poruke.</p>
          </div>
          {selectedClients.length > 0 && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <EnvelopeIcon className="h-5 w-5" />
              Posalji email ({selectedClients.length})
            </button>
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Ukupno klijenata</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{totalClients}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Oznaceni klijenti</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{selectedClients.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Aktivni filteri</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{activeFilterCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pretraga po imenu, email-u ili telefonu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={lastVisitFilter}
              onChange={(e) => setLastVisitFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Svi klijenti</option>
              <option value="week">Zadnjih 7 dana</option>
              <option value="month">Zadnjih 30 dana</option>
              <option value="3months">Zadnja 3 mjeseca</option>
              <option value="6months">Zadnjih 6 mjeseci</option>
              <option value="year">Zadnjih 12 mjeseci</option>
            </select>

            <button
              onClick={selectAllVisibleClients}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {allVisibleSelected ? 'Ponisti sve' : 'Oznaci sve'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zaposleni</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">Svi zaposleni</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usluge</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">Sve usluge</option>
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}{service.category ? ` (${service.category})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategorije usluga</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">Sve kategorije</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500 -mt-2">Izaberite po jedan filter ili ostavite na "Sve".</p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-600">
              Prikazano {clients.length} od {totalClients} klijenata
            </p>
            {hasAdvancedFilters && (
              <button onClick={clearAdvancedFilters} className="text-sm text-orange-700 hover:text-orange-800 font-medium">
                Ocisti filtere
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nema klijenata za izabrane filtere.</p>
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
                        checked={allVisibleSelected}
                        onChange={selectAllVisibleClients}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klijent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Termini</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zadnja posjeta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ukupno potroseno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {client.avatar ? (
                            <img src={client.avatar} alt={client.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-orange-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">Clan od {formatDate(client.member_since)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4" />
                            {client.email || '-'}
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
                          <span className="text-sm text-gray-500">({client.completed_appointments} zavrseno)</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(client.last_visit)}</td>

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
                            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                          >
                            Detalji
                          </button>
                          <button
                            onClick={() => sendEmailToClient(client.id)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
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

        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Posalji email ({selectedClients.length} klijenata)</h3>
                  <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Naslov</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Unesite naslov email-a"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poruka</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Primjer: Dragi {ime}, ..."
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Placeholderi: <code>{'{ime}'}</code>, <code>{'{korisnicko_ime}'}</code>, <code>{'{name}'}</code>.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Otkazi
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  {sendingEmail ? 'Saljem...' : 'Posalji'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showClientDetails && selectedClient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Detalji klijenta</h3>
                <button onClick={() => setShowClientDetails(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  {selectedClient.client.avatar ? (
                    <img src={selectedClient.client.avatar} alt={selectedClient.client.name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{selectedClient.client.name}</h4>
                    <p className="text-gray-600">{selectedClient.client.email || '-'}</p>
                    {selectedClient.client.phone && <p className="text-gray-600">{selectedClient.client.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">Ukupno termina</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedClient.stats.total_appointments}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-700 font-medium">Zavrseno</p>
                    <p className="text-2xl font-bold text-green-900">{selectedClient.stats.completed_appointments}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">Otkazano</p>
                    <p className="text-2xl font-bold text-red-900">{selectedClient.stats.cancelled_appointments}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-700 font-medium">Ukupno potroseno</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(selectedClient.stats.total_spent)}</p>
                  </div>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-gray-900 mb-4">Istorija termina</h5>
                  <div className="space-y-3">
                    {selectedClient.appointments.map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(appointment.date)} u {appointment.time}
                            </p>
                            <p className="text-sm text-gray-600">{appointment.services.join(', ')}</p>
                            {appointment.staff && <p className="text-sm text-gray-500">Zaposleni: {appointment.staff}</p>}
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : appointment.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : appointment.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {appointment.status}
                            </span>
                            <p className="font-bold text-gray-900 mt-1">{formatCurrency(appointment.total_price)}</p>
                          </div>
                        </div>
                        {appointment.notes && <p className="text-sm text-gray-600 italic">Napomena: {appointment.notes}</p>}
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
