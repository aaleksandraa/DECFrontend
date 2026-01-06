import React, { useState, useEffect } from 'react';
import { 
  ClipboardIcon, 
  KeyIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon,
  GlobeAltIcon,
  EyeIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { Toast, ToastType } from '../Common/Toast';

interface Salon {
  id: number;
  name: string;
  slug: string;
  city: string;
}

interface Widget {
  id: number;
  salon_id: number;
  api_key: string;
  is_active: boolean;
  allowed_domains: string[];
  theme: any;
  settings: any;
  total_bookings: number;
  last_used_at: string | null;
  created_at: string;
}

interface EmbedCode {
  javascript: string;
  javascript_dark?: string;
  javascript_custom?: string;
  api_key: string;
  widget_url: string;
  salon_slug?: string;
  customization?: {
    primary_color: string;
    available_options: Record<string, string>;
  };
}

interface Analytics {
  period: {
    days: number;
    start_date: string;
    end_date: string;
  };
  summary: {
    total_views: number;
    total_bookings: number;
    conversion_rate: number;
  };
  top_domains: Array<{
    domain: string;
    views: number;
    bookings: number;
  }>;
  daily_stats: Array<{
    date: string;
    views: number;
    bookings: number;
  }>;
}

export const AdminWidgetManagement: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [widget, setWidget] = useState<Widget | null>(null);
  const [embedCode, setEmbedCode] = useState<EmbedCode | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [activeTab, setActiveTab] = useState<'iframe' | 'javascript'>('iframe');
  
  // Settings form
  const [isActive, setIsActive] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [serviceDisplay, setServiceDisplay] = useState<'list' | 'categories'>('list');

  useEffect(() => {
    loadSalons();
  }, []);

  useEffect(() => {
    if (selectedSalon) {
      loadWidgetData(selectedSalon.id);
    }
  }, [selectedSalon]);

  const loadSalons = async () => {
    try {
      const response = await api.get('/admin/salons');
      setSalons(response.data.salons || response.data.data || []);
    } catch (error) {
      console.error('Error loading salons:', error);
      setToast({ message: 'Greška pri učitavanju salona', type: 'error' });
    }
  };

  const loadWidgetData = async (salonId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/widget/${salonId}`);
      
      setWidget(response.data.widget);
      setEmbedCode(response.data.embed_code);
      
      if (response.data.widget) {
        setIsActive(response.data.widget.is_active);
        setAllowedDomains(response.data.widget.allowed_domains || []);
        setServiceDisplay(response.data.widget.settings?.service_display || 'list');
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('Error loading widget:', error);
      }
      setWidget(null);
      setEmbedCode(null);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!selectedSalon) return;

    try {
      setLoading(true);
      const response = await api.post(`/admin/widget/${selectedSalon.id}/generate`);
      
      setWidget(response.data.widget);
      setEmbedCode(response.data.embed_code);
      setShowCode(true);
      
      setToast({ 
        message: 'API key uspješno generisan!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      setToast({ 
        message: 'Greška pri generisanju API key-a', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    if (!selectedSalon || !widget) return;

    try {
      setLoading(true);
      await api.put(`/admin/widget/${selectedSalon.id}/settings`, {
        is_active: isActive,
        allowed_domains: allowedDomains,
        settings: {
          service_display: serviceDisplay,
        },
      });
      
      setToast({ 
        message: 'Postavke uspješno ažurirane!', 
        type: 'success' 
      });
      
      await loadWidgetData(selectedSalon.id);
    } catch (error) {
      console.error('Error updating settings:', error);
      setToast({ 
        message: 'Greška pri ažuriranju postavki', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (days: number = 30) => {
    if (!selectedSalon || !widget) return;

    try {
      setLoading(true);
      const response = await api.get(`/admin/widget/${selectedSalon.id}/analytics?days=${days}`);
      setAnalytics(response.data);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setToast({ 
        message: 'Greška pri učitavanju analytics-a', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast({ 
        message: 'Kopirano u clipboard!', 
        type: 'success' 
      });
    }).catch(() => {
      setToast({ 
        message: 'Greška pri kopiranju', 
        type: 'error' 
      });
    });
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain)) {
      setToast({ 
        message: 'Nevažeći format domena', 
        type: 'error' 
      });
      return;
    }
    
    if (allowedDomains.includes(newDomain)) {
      setToast({ 
        message: 'Domen već postoji', 
        type: 'error' 
      });
      return;
    }
    
    setAllowedDomains([...allowedDomains, newDomain]);
    setNewDomain('');
  };

  const removeDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domain));
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Widget Management</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generiši i upravljaj booking widget-ima za salone
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
              <GlobeAltIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Salon Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Izaberite salon
          </label>
          <select
            value={selectedSalon?.id || ''}
            onChange={(e) => {
              const salon = salons.find(s => s.id === parseInt(e.target.value));
              setSelectedSalon(salon || null);
              setShowCode(false);
              setShowAnalytics(false);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Izaberite salon...</option>
            {salons.map(salon => (
              <option key={salon.id} value={salon.id}>
                {salon.name} - {salon.city}
              </option>
            ))}
          </select>
        </div>

        {selectedSalon && (
          <div className="space-y-6">
            {/* Widget Status */}
            {widget && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${widget.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Widget Status: {widget.is_active ? 'Aktivan' : 'Neaktivan'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Ukupno rezervacija: {widget.total_bookings}
                      </p>
                    </div>
                  </div>
                  {widget.last_used_at && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Posljednja upotreba:</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(widget.last_used_at).toLocaleDateString('bs-BA')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateApiKey}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <KeyIcon className="w-5 h-5" />
                )}
                {widget ? 'Regeneriši API Key' : 'Generiši API Key'}
              </button>

              {widget && (
                <>
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ClipboardIcon className="w-5 h-5" />
                    {showCode ? 'Sakrij' : 'Prikaži'} Embed Code
                  </button>

                  <button
                    onClick={() => loadAnalytics(30)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    Analytics
                  </button>
                </>
              )}
            </div>

            {/* Embed Code */}
            {showCode && embedCode && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Embed Code</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('javascript')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'javascript'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Light Theme
                    </button>
                    <button
                      onClick={() => setActiveTab('iframe')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'iframe'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Dark Theme
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {activeTab === 'javascript' ? '☀️ Light Theme Widget' : '🌙 Dark Theme Widget'}
                    </h4>
                    <button
                      onClick={() => copyToClipboard(activeTab === 'javascript' ? embedCode.javascript : (embedCode.javascript_dark || embedCode.javascript))}
                      className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <ClipboardIcon className="w-4 h-4" />
                      Kopiraj
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed">
                    {activeTab === 'javascript' ? embedCode.javascript : (embedCode.javascript_dark || embedCode.javascript)}
                  </pre>
                </div>

                {/* Customization Options */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">🎨 Opcije za Customizaciju</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                      <code className="text-purple-700 font-mono">data-primary-color</code>
                      <p className="text-gray-600 mt-1">Glavna boja (hex, npr. #FF6B35)</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                      <code className="text-purple-700 font-mono">data-theme</code>
                      <p className="text-gray-600 mt-1">"light" ili "dark"</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                      <code className="text-purple-700 font-mono">data-button-text</code>
                      <p className="text-gray-600 mt-1">Tekst na dugmetu</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                      <code className="text-purple-700 font-mono">data-button-radius</code>
                      <p className="text-gray-600 mt-1">Zaobljenost dugmeta (npr. 8px, 24px)</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                      <code className="text-purple-700 font-mono">data-font</code>
                      <p className="text-gray-600 mt-1">Font family</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                      <code className="text-purple-700 font-mono">data-container</code>
                      <p className="text-gray-600 mt-1">Custom container ID</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Instrukcije za salon:
                  </h4>
                  <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                    <li>Kopirajte kod iznad</li>
                    <li>Zalijepite ga na svoj website (HTML fajl)</li>
                    <li>Widget će automatski raditi i prikazivati booking formu</li>
                    <li>Prilagodite boje i stil po želji koristeći data-* atribute</li>
                    <li>Sve rezervacije će biti vidljive u Frizerino sistemu</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Sigurnosne napomene:</h4>
                  <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                    <li>API key je tajan - ne dijelite ga javno</li>
                    <li>Dodajte dozvoljene domene ispod za dodatnu sigurnost</li>
                    <li>Možete regenerisati key ako je kompromitovan</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Settings */}
            {widget && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Postavke Widget-a</h3>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Status Widget-a</p>
                    <p className="text-sm text-gray-600">Aktiviraj ili deaktiviraj widget</p>
                  </div>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Service Display Mode */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">Prikaz Usluga</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Odaberite kako će se usluge prikazivati na widget-u
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="serviceDisplay"
                        value="list"
                        checked={serviceDisplay === 'list'}
                        onChange={() => setServiceDisplay('list')}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Lista</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="serviceDisplay"
                        value="categories"
                        checked={serviceDisplay === 'categories'}
                        onChange={() => setServiceDisplay('categories')}
                        className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Po kategorijama</span>
                    </label>
                  </div>
                </div>

                {/* Allowed Domains */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">Dozvoljeni Domeni</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Widget će raditi samo sa ovih domena. Ostavite prazno za sve domene.
                  </p>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                      placeholder="npr. salon-website.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={addDomain}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                    >
                      Dodaj
                    </button>
                  </div>

                  {allowedDomains.length > 0 && (
                    <div className="space-y-2">
                      {allowedDomains.map((domain, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{domain}</span>
                          <button
                            onClick={() => removeDomain(domain)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={updateSettings}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircleIcon className="w-5 h-5" />
                  )}
                  Sačuvaj Postavke
                </button>
              </div>
            )}

            {/* Analytics */}
            {showAnalytics && analytics && (
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                  <button
                    onClick={() => loadAnalytics(30)}
                    className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Osvježi
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <EyeIcon className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Pregledi</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{analytics.summary.total_views}</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDaysIcon className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-medium text-green-900">Rezervacije</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{analytics.summary.total_bookings}</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ChartBarIcon className="w-5 h-5 text-purple-600" />
                      <p className="text-sm font-medium text-purple-900">Conversion Rate</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{analytics.summary.conversion_rate}%</p>
                  </div>
                </div>

                {/* Top Domains */}
                {analytics.top_domains.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Top Domeni</h4>
                    <div className="space-y-2">
                      {analytics.top_domains.slice(0, 5).map((domain, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <span className="text-sm text-gray-700">{domain.domain}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-blue-600">{domain.views} pregleda</span>
                            <span className="text-green-600">{domain.bookings} rezervacija</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWidgetManagement;
