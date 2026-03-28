import React, { useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';

type TokenStatus = 'valid' | 'expiring_soon' | 'expired' | 'unknown';

interface HealthSummary {
  total_integrations: number;
  active_integrations: number;
  expired_tokens: number;
  expiring_tokens: number;
  webhook_unverified: number;
  salons_with_failed_send: number;
}

interface HealthRow {
  salon_id: number;
  salon_name: string | null;
  salon_city: string | null;
  integration_id: number;
  integration_status: string;
  platform: 'facebook' | 'instagram' | 'both';
  fb_page_name: string | null;
  ig_username: string | null;
  token_expires_at: string | null;
  token_status: TokenStatus;
  days_until_expiry: number | null;
  webhook_verified: boolean;
  last_verified_at: string | null;
  last_failed_send: {
    failed_at: string;
    error_message: string | null;
  } | null;
}

const emptySummary: HealthSummary = {
  total_integrations: 0,
  active_integrations: 0,
  expired_tokens: 0,
  expiring_tokens: 0,
  webhook_unverified: 0,
  salons_with_failed_send: 0,
};

export function AdminSocialIntegrationsHealth() {
  const [summary, setSummary] = useState<HealthSummary>(emptySummary);
  const [rows, setRows] = useState<HealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/admin/social-integrations/health');
      const payload = response.data?.data;

      setSummary(payload?.summary ?? emptySummary);
      setRows(payload?.salons ?? []);
    } catch (err) {
      setError('Greska pri ucitavanju health-check podataka.');
      setSummary(emptySummary);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const tokenBadge = (status: TokenStatus) => {
    if (status === 'valid') {
      return { label: 'Validan', className: 'bg-green-100 text-green-700' };
    }
    if (status === 'expiring_soon') {
      return { label: 'Istice uskoro', className: 'bg-amber-100 text-amber-700' };
    }
    if (status === 'expired') {
      return { label: 'Istekao', className: 'bg-red-100 text-red-700' };
    }

    return { label: 'Nepoznato', className: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Social Integrations Health</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pregled tokena, webhook statusa i zadnjih failed send-ova po salonu.
            </p>
          </div>

          <button
            onClick={() => void loadHealth()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Osvjezi
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <SummaryCard label="Ukupno" value={summary.total_integrations} />
        <SummaryCard label="Aktivne" value={summary.active_integrations} />
        <SummaryCard label="Token istekao" value={summary.expired_tokens} />
        <SummaryCard label="Token istice" value={summary.expiring_tokens} />
        <SummaryCard label="Webhook problem" value={summary.webhook_unverified} />
        <SummaryCard label="Failed send" value={summary.salons_with_failed_send} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Salon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Integracija</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Token</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Webhook</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Zadnji failed send</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>
                    Nema podataka za prikaz.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const token = tokenBadge(row.token_status);
                  return (
                    <tr key={row.integration_id}>
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-gray-900">{row.salon_name ?? 'Nepoznat salon'}</p>
                        <p className="text-xs text-gray-500">{row.salon_city ?? '-'}</p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <p className="text-sm font-medium text-gray-900">{row.fb_page_name || '-'}</p>
                        <p className="text-xs text-gray-500">
                          {row.platform === 'both' ? 'Facebook + Instagram' : row.platform}
                        </p>
                        {row.ig_username && (
                          <p className="text-xs text-purple-700 mt-1">@{row.ig_username}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Status: {row.integration_status}</p>
                      </td>

                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${token.className}`}>
                          {token.label}
                        </span>
                        {row.token_expires_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Istice: {new Date(row.token_expires_at).toLocaleDateString('sr-Latn-RS')}
                          </p>
                        )}
                        {row.days_until_expiry !== null && (
                          <p className="text-xs text-gray-500">
                            Dana do isteka: {row.days_until_expiry}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        {row.webhook_verified ? (
                          <div className="inline-flex items-center gap-1 text-green-700 text-sm">
                            <CheckCircleIcon className="w-4 h-4" />
                            Verifikovan
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-red-700 text-sm">
                            <XCircleIcon className="w-4 h-4" />
                            Nije verifikovan
                          </div>
                        )}
                        {row.last_verified_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Zadnja provjera: {new Date(row.last_verified_at).toLocaleString('sr-Latn-RS')}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 align-top">
                        {row.last_failed_send ? (
                          <>
                            <div className="inline-flex items-center gap-1 text-amber-700 text-sm">
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              {new Date(row.last_failed_send.failed_at).toLocaleString('sr-Latn-RS')}
                            </div>
                            <p className="text-xs text-gray-600 mt-2 break-words max-w-xs">
                              {row.last_failed_send.error_message || 'Bez poruke o gresci'}
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Nema failed send</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
