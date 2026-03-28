import React, { useEffect, useMemo, useState } from 'react';
import { Instagram, Facebook, MessageCircle, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

type SocialStatus = 'connected' | 'select_page' | 'oauth_cancelled' | 'oauth_missing_code' | 'oauth_invalid_state' | 'oauth_invalid_payload' | 'oauth_state_expired' | 'oauth_invalid_user' | 'error_callback' | 'error_no_salon' | 'error_config';

interface PendingPage {
  id: string;
  name: string;
}

interface SocialIntegration {
  id: number;
  platform: 'facebook' | 'instagram' | 'both';
  fb_page_name?: string;
  ig_username?: string;
  status: 'active' | 'pending' | 'expired' | 'revoked';
  auto_reply_enabled: boolean;
  business_hours_only?: boolean;
  chatbot_enabled?: boolean;
  token_expires_at?: string | null;
  connected_at: string;
  stats?: {
    total_conversations: number;
    successful_bookings: number;
    booking_conversion_rate: number;
  };
}

export default function SocialIntegrationsPage() {
  const [integration, setIntegration] = useState<SocialIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [statusInfo, setStatusInfo] = useState<string | null>(null);
  const [pendingPages, setPendingPages] = useState<PendingPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [pendingExpiresAt, setPendingExpiresAt] = useState<string | null>(null);
  const [loadingPendingPages, setLoadingPendingPages] = useState(false);
  const [selectingPage, setSelectingPage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const socialStatus = params.get('social_status') as SocialStatus | null;

    if (socialStatus) {
      setStatusInfo(getStatusMessage(socialStatus));
      params.delete('social_status');
      const newQuery = params.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }

    fetchIntegration();
    fetchPendingPages();
  }, []);

  const tokenExpiryText = useMemo(() => {
    if (!integration?.token_expires_at) return null;
    const date = new Date(integration.token_expires_at);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [integration?.token_expires_at]);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/social-integrations');
      setIntegration(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIntegration(null);
      } else {
        setError('Greska pri ucitavanju integracije.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPages = async () => {
    try {
      setLoadingPendingPages(true);
      const response = await api.get('/admin/social-integrations/pending-pages');
      const data = response.data?.data;

      if (!data?.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
        setPendingPages([]);
        setSelectedPageId('');
        setPendingExpiresAt(null);
        return;
      }

      setPendingPages(data.pages);
      setPendingExpiresAt(data.expires_at ?? null);
      setSelectedPageId((current) => {
        if (current && data.pages.some((page: PendingPage) => page.id === current)) {
          return current;
        }
        return data.pages[0].id;
      });
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setError('Greska pri ucitavanju Facebook stranica za izbor.');
      }
      setPendingPages([]);
      setSelectedPageId('');
      setPendingExpiresAt(null);
    } finally {
      setLoadingPendingPages(false);
    }
  };

  const handleSelectPage = async () => {
    if (!selectedPageId) {
      setError('Izaberite Facebook stranicu prije potvrde.');
      return;
    }

    try {
      setError(null);
      setSelectingPage(true);
      await api.post('/admin/social-integrations/select-page', { page_id: selectedPageId });
      setPendingPages([]);
      setPendingExpiresAt(null);
      setStatusInfo('Facebook stranica je uspjesno povezana.');
      await fetchIntegration();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Greska pri povezivanju izabrane Facebook stranice.');
    } finally {
      setSelectingPage(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/v1/admin/social-integrations/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Da li ste sigurni da zelite odspojiti Instagram/Facebook?')) {
      return;
    }

    try {
      await api.post('/admin/social-integrations/disconnect');
      setIntegration(null);
      setStatusInfo('Integracija je uspjesno odspojena.');
    } catch {
      setError('Greska pri odspajanju.');
    }
  };

  const patchIntegration = async (payload: Partial<Pick<SocialIntegration, 'auto_reply_enabled' | 'business_hours_only' | 'chatbot_enabled'>>) => {
    if (!integration) return;

    try {
      setToggling(true);
      await api.patch(`/admin/social-integrations/${integration.id}`, payload);
      await fetchIntegration();
    } catch {
      setError('Greska pri promjeni postavki.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Instagram & Facebook Integracija</h1>
        <p className="text-gray-600">Povezite Instagram/Facebook i omogucite AI zakazivanje porukama.</p>
      </div>

      {statusInfo && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          {statusInfo}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Greska</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {pendingPages.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Izbor Facebook stranice</h2>
            <p className="text-gray-600 mb-6">
              Na profilu imate vise Facebook Page-ova. Izaberite stranicu koju zelite povezati sa salonom.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Facebook stranica</label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              disabled={selectingPage || loadingPendingPages}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {pendingPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>

            {pendingExpiresAt && (
              <p className="mt-3 text-sm text-amber-700">
                Ovaj izbor istice: {new Date(pendingExpiresAt).toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSelectPage}
                disabled={selectingPage || loadingPendingPages}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-lg transition-colors"
              >
                {selectingPage ? 'Povezujem...' : 'Potvrdi izbor stranice'}
              </button>
              <button
                onClick={handleConnect}
                disabled={selectingPage}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-5 rounded-lg transition-colors"
              >
                Pokreni autorizaciju ponovo
              </button>
            </div>
          </div>
        ) : !integration ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex -space-x-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Instagram className="w-8 h-8 text-white" />
              </div>
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <Facebook className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Automatski odgovori i booking preko DM-a</h2>
              <p className="text-gray-600">Jedan klik za povezivanje salona.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Sta dobijate:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Auto odgovor 24/7</strong> za poruke klijenata.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>AI zakazivanje termina</strong> direktno iz poruka.</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Centralna kontrola</strong> za ukljucenje/iskljucenje AI-a po salonu.</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
            Potreban je Instagram Business Account ili Facebook Page.
          </div>

          <button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-5 h-5" />
            Povezi Instagram/Facebook
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">Bicete preusmjereni na Facebook autorizaciju.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-gray-900">Povezano</h2>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(integration.platform === 'both' || integration.platform === 'facebook') && integration.fb_page_name && (
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                      <Facebook className="w-4 h-4" />
                      <span className="font-medium">{integration.fb_page_name}</span>
                    </div>
                  )}

                  {(integration.platform === 'both' || integration.platform === 'instagram') && integration.ig_username && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 px-3 py-1.5 rounded-lg">
                      <Instagram className="w-4 h-4" />
                      <span className="font-medium">@{integration.ig_username}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Povezano: {new Date(integration.connected_at).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {tokenExpiryText && (
                  <p className="text-sm text-amber-700 mt-1">Token istice: {tokenExpiryText}</p>
                )}
              </div>

              <button
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Odspoji
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-4">
              <ToggleRow
                title="AI asistent aktivan"
                description="Globalni prekidac za AI obradu poruka i zakazivanje."
                enabled={integration.chatbot_enabled ?? false}
                loading={toggling}
                onToggle={(enabled) => patchIntegration({ chatbot_enabled: enabled })}
              />

              <ToggleRow
                title="Automatski odgovori"
                description="Ako je ukljuceno, AI automatski odgovara na nove poruke."
                enabled={integration.auto_reply_enabled}
                loading={toggling}
                onToggle={(enabled) => patchIntegration({ auto_reply_enabled: enabled })}
              />

              <ToggleRow
                title="Samo u radno vrijeme"
                description="Auto odgovor radi samo u satnici salona."
                enabled={integration.business_hours_only ?? false}
                loading={toggling}
                onToggle={(enabled) => patchIntegration({ business_hours_only: enabled })}
              />
            </div>
          </div>

          {integration.stats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Statistika (zadnjih 30 dana)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                  <Users className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{integration.stats.total_conversations}</p>
                  <p className="text-sm text-gray-600 mt-1">Razgovora</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{integration.stats.successful_bookings}</p>
                  <p className="text-sm text-gray-600 mt-1">Rezervacija</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                  <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{integration.stats.booking_conversion_rate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600 mt-1">Konverzija</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            Kada klijent posalje poruku na Instagram/Facebook, AI moze odgovoriti, prikupiti podatke i pokusati napraviti rezervaciju termina.
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  loading,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  loading: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <p className="font-semibold text-gray-900 mb-1">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function getStatusMessage(status: SocialStatus): string {
  switch (status) {
    case 'connected':
      return 'Instagram/Facebook integracija je uspjesno povezana.';
    case 'select_page':
      return 'Izaberite koju Facebook stranicu zelite povezati.';
    case 'oauth_cancelled':
      return 'Autorizacija je otkazana.';
    case 'oauth_missing_code':
      return 'OAuth callback je bez authorization koda.';
    case 'oauth_invalid_state':
    case 'oauth_invalid_payload':
    case 'oauth_state_expired':
      return 'OAuth sigurnosna provjera nije uspjela. Pokusajte ponovo.';
    case 'oauth_invalid_user':
      return 'OAuth sesija ne pripada trenutno prijavljenom korisniku. Pokrenite povezivanje ponovo.';
    case 'error_no_salon':
      return 'Salon nije pronadjen za prijavljenog korisnika.';
    case 'error_config':
      return 'Meta konfiguracija nije kompletna (APP ID/SECRET).';
    default:
      return 'Doslo je do greske pri povezivanju integracije.';
  }
}

