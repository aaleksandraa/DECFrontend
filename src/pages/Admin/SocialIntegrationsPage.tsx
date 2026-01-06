import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, MessageCircle, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface SocialIntegration {
  id: number;
  platform: 'facebook' | 'instagram' | 'both';
  fb_page_name?: string;
  ig_username?: string;
  status: 'active' | 'pending' | 'expired' | 'revoked';
  auto_reply_enabled: boolean;
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

  useEffect(() => {
    fetchIntegration();
  }, []);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/admin/social-integrations');
      setIntegration(response.data.data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('Greška pri učitavanju integracije');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to OAuth flow
    window.location.href = '/api/v1/admin/social-integrations/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Da li ste sigurni da želite odspojiti Instagram/Facebook?')) {
      return;
    }

    try {
      await axios.post('/api/v1/admin/social-integrations/disconnect');
      setIntegration(null);
    } catch (err) {
      setError('Greška pri odspajanju');
    }
  };

  const toggleAutoReply = async (enabled: boolean) => {
    if (!integration) return;

    try {
      setToggling(true);
      await axios.patch(`/api/v1/admin/social-integrations/${integration.id}`, {
        auto_reply_enabled: enabled,
      });
      setIntegration({ ...integration, auto_reply_enabled: enabled });
    } catch (err) {
      setError('Greška pri promjeni postavki');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Instagram & Facebook Integracija
        </h1>
        <p className="text-gray-600">
          Povežite vaš Instagram i Facebook nalog za automatske odgovore na poruke
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Greška</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {!integration ? (
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
              <h2 className="text-2xl font-bold text-gray-900">
                Automatski odgovarajte na DM poruke
              </h2>
              <p className="text-gray-600">
                AI asistent koji radi 24/7
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Šta dobijate:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Automatski odgovori 24/7</strong> - AI asistent odgovara na poruke čak i kada niste dostupni
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Direktno zakazivanje termina</strong> - Klijenti mogu zakazati termin direktno preko Instagram/Facebook poruka
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Informacije o cijenama i radnom vremenu</strong> - Automatski odgovori na česta pitanja
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">
                  <strong>Razumijevanje prirodnog jezika</strong> - AI razumije poruke na srpskom/bosanskom jeziku
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Napomena:</strong> Potreban vam je Instagram Business Account ili Facebook Page povezan sa Instagram-om.
            </p>
          </div>

          <button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-5 h-5" />
            Poveži Instagram/Facebook
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Bićete preusmjereni na Facebook za autorizaciju
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected Status */}
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
                  Povezano: {new Date(integration.connected_at).toLocaleDateString('sr-Latn-RS', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              <button
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Odspoji
              </button>
            </div>

            {/* Auto Reply Toggle */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Automatski odgovori</p>
                  <p className="text-sm text-gray-600">
                    AI će automatski odgovarati na nove poruke
                  </p>
                </div>
                <button
                  onClick={() => toggleAutoReply(!integration.auto_reply_enabled)}
                  disabled={toggling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    integration.auto_reply_enabled ? 'bg-blue-600' : 'bg-gray-200'
                  } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      integration.auto_reply_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {integration.stats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Statistika (zadnjih 30 dana)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {integration.stats.total_conversations}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Razgovora</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {integration.stats.successful_bookings}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Rezervacija</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {integration.stats.booking_conversion_rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Konverzija</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Kako radi:</strong> Kada neko pošalje poruku na vaš Instagram ili Facebook, AI asistent će automatski odgovoriti i pomoći im da zakažu termin. Sve rezervacije se automatski pojavljuju u vašem kalendaru.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
