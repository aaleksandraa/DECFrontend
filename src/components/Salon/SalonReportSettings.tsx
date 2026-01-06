import React, { useState, useEffect } from 'react';
import { salonSettingsAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface SalonSettings {
  id: number;
  salon_id: number;
  daily_report_enabled: boolean;
  daily_report_time: string;
  daily_report_email: string | null;
  daily_report_include_staff: boolean;
  daily_report_include_services: boolean;
  daily_report_include_capacity: boolean;
  daily_report_include_cancellations: boolean;
}

interface SalonInfo {
  id: number;
  name: string;
  owner_email: string;
}

const SalonReportSettings: React.FC = () => {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [salon, setSalon] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await salonSettingsAPI.getSettings();
      setSettings(response.settings);
      setSalon(response.salon);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404 && error.response?.data?.error === 'NO_SALON') {
        toast.error('Molimo vas da prvo završite profil salona');
        setError('Nemate kreiran salon. Molimo vas da prvo završite profil salona.');
      } else if (error.response?.status === 403) {
        toast.error('Nemate pristup ovoj funkcionalnosti');
        setError('Ova funkcionalnost je dostupna samo za vlasnike salona.');
      } else {
        toast.error('Greška pri učitavanju podešavanja');
        setError('Greška pri učitavanju podešavanja. Molimo pokušajte ponovo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await salonSettingsAPI.updateSettings({
        daily_report_enabled: settings.daily_report_enabled,
        daily_report_time: settings.daily_report_time,
        daily_report_email: settings.daily_report_email || undefined,
        daily_report_include_staff: settings.daily_report_include_staff,
        daily_report_include_services: settings.daily_report_include_services,
        daily_report_include_capacity: settings.daily_report_include_capacity,
        daily_report_include_cancellations: settings.daily_report_include_cancellations,
      });
      setSettings(response.settings);
      toast.success('Podešavanja uspješno sačuvana');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Greška pri čuvanju podešavanja');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    try {
      setSendingTest(true);
      const response = await salonSettingsAPI.sendTestReport();
      toast.success(`Testni izvještaj poslan na ${response.email}`);
    } catch (error: any) {
      console.error('Error sending test report:', error);
      toast.error(error.response?.data?.message || 'Greška pri slanju testnog izvještaja');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Salon nije pronađen</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/dashboard?section=profile'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Idi na profil salona
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!settings || !salon) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Podešavanja nisu dostupna</p>
      </div>
    );
  }

  const emailAddress = settings.daily_report_email || salon.owner_email;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dnevni izvještaji</h2>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Omogući dnevne izvještaje</h3>
              <p className="text-sm text-gray-600 mt-1">
                Primajte automatski email izvještaj svaki dan sa pregledom poslovanja
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.daily_report_enabled}
                onChange={(e) => setSettings({ ...settings, daily_report_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vrijeme slanja izvještaja
            </label>
            <input
              type="time"
              value={settings.daily_report_time}
              onChange={(e) => setSettings({ ...settings, daily_report_time: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Izvještaj će biti poslan svaki dan u odabrano vrijeme
            </p>
          </div>

          {/* Email Override */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email adresa (opciono)
            </label>
            <input
              type="email"
              value={settings.daily_report_email || ''}
              onChange={(e) => setSettings({ ...settings, daily_report_email: e.target.value || null })}
              placeholder={salon.owner_email}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ako ostavite prazno, izvještaj će biti poslan na: <span className="font-medium">{salon.owner_email}</span>
            </p>
          </div>

          {/* Sections to Include */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Sadržaj izvještaja</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.daily_report_include_staff}
                  onChange={(e) => setSettings({ ...settings, daily_report_include_staff: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">Promet po radniku</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.daily_report_include_services}
                  onChange={(e) => setSettings({ ...settings, daily_report_include_services: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">Analiza usluga</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.daily_report_include_capacity}
                  onChange={(e) => setSettings({ ...settings, daily_report_include_capacity: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">Popunjenost termina</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.daily_report_include_cancellations}
                  onChange={(e) => setSettings({ ...settings, daily_report_include_cancellations: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700">Otkazivanja i no-show</span>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">O dnevnim izvještajima</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Dnevni izvještaj sadrži:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Ukupan promet i broj termina</li>
                    <li>Broj jedinstvenih klijenata</li>
                    <li>Prosječnu vrijednost termina</li>
                    <li>Trend u odnosu na prethodnih 7 dana</li>
                    <li>Automatski generisan zaključak dana</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Čuvanje...' : 'Sačuvaj podešavanja'}
            </button>

            <button
              onClick={handleSendTest}
              disabled={sendingTest}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {sendingTest ? 'Slanje...' : 'Pošalji testni izvještaj'}
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            Testni izvještaj će biti poslan na: <span className="font-medium">{emailAddress}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalonReportSettings;
