import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, CheckCircle, ArrowLeft, Scissors } from 'lucide-react';
import { authAPI } from '../../services/api';

export const RegistrationSuccessPage: React.FC = () => {
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!email) return;

    setResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      await authAPI.resendVerificationEmail(email);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setResendError('Previše pokušaja. Molimo sačekajte par minuta.');
      } else {
        setResendError(err.response?.data?.message || 'Greška pri slanju emaila.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registracija uspješna | Frizerino</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex flex-col">
        {/* Header */}
        <header className="p-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Frizerino</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            {/* Success Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
              {/* Icon */}
              <div className="relative inline-block mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                  <Mail className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Registracija uspješna!
              </h1>

              {/* Description */}
              <p className="text-lg text-gray-600 mb-2">
                Hvala što ste se registrovali na Frizerino platformu.
              </p>
              
              {email && (
                <p className="text-gray-600 mb-6">
                  Poslali smo verifikacijski link na{' '}
                  <strong className="text-gray-900">{email}</strong>
                </p>
              )}

              {/* Steps */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">
                  Sljedeći koraci:
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Otvorite vaš email</p>
                      <p className="text-sm text-gray-600">Provjerite inbox ili spam folder</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Kliknite na verifikacijski link</p>
                      <p className="text-sm text-gray-600">Link vrijedi 60 minuta</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Prijavite se</p>
                      <p className="text-sm text-gray-600">Nakon potvrde možete koristiti svoj nalog</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Napomena:</strong> Ako ne vidite email u inbox-u, 
                  provjerite folder za neželjenu poštu (spam).
                </p>
              </div>

              {/* Resend Success */}
              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-green-800">
                    ✅ Email je ponovo poslan! Provjerite vaš inbox.
                  </p>
                </div>
              )}

              {/* Resend Error */}
              {resendError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-800">
                    ❌ {resendError}
                  </p>
                </div>
              )}

              {/* Resend Button */}
              {email && (
                <button
                  onClick={handleResendEmail}
                  disabled={resending || resendSuccess}
                  className="w-full mb-4 text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? 'Šaljem...' : 'Niste dobili email? Pošalji ponovo'}
                </button>
              )}

              {/* Action Button */}
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
              >
                Idi na prijavu
              </Link>

              {/* Back to home */}
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 mt-4 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Nazad na početnu
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-gray-500">
          © 2025 Frizerino.com. Sva prava zadržana.
        </footer>
      </div>
    </>
  );
};
