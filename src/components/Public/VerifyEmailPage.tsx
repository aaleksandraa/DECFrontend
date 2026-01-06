import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState('');
  const verifiedRef = useRef(false);

  useEffect(() => {
    // Prevent double verification in React StrictMode
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verifyEmail = async () => {
      const url = searchParams.get('url');
      
      if (!url) {
        setStatus('error');
        setMessage('Nevažeći verifikacijski link.');
        return;
      }

      try {
        // URL is the full backend URL, we need to extract the path
        // e.g., http://localhost:8000/api/v1/email/verify/1/hash?signature=...
        const parsedUrl = new URL(url);
        let pathWithQuery = parsedUrl.pathname + parsedUrl.search;
        
        // Remove /api/v1 prefix since api instance already has baseURL with /api/v1
        if (pathWithQuery.startsWith('/api/v1/')) {
          pathWithQuery = pathWithQuery.substring(8); // Remove '/api/v1/'
        } else if (pathWithQuery.startsWith('/api/')) {
          pathWithQuery = pathWithQuery.substring(5); // Remove '/api/'
        }
        
        // Call the API endpoint
        const response = await api.get(pathWithQuery);
        
        if (response.data.already_verified) {
          setStatus('already_verified');
          setMessage('Vaš email je već potvrđen.');
        } else if (response.data.verified) {
          setStatus('success');
          setMessage('Email uspješno potvrđen!');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        const errorMessage = error.response?.data?.message || 'Greška pri verifikaciji emaila.';
        
        // Check for rate limit error
        if (error.response?.status === 429) {
          setMessage('Previše pokušaja. Molimo sačekajte par minuta i pokušajte ponovo.');
        } else {
          setMessage(errorMessage);
        }
        setStatus('error');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>Potvrda email adrese | Frizerino</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <MainNavbar />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Potvrđujem email...
              </h1>
              <p className="text-gray-600">
                Molimo sačekajte dok potvrđujemo vašu email adresu.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email potvrđen!
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Prijavi se
              </Link>
            </>
          )}

          {status === 'already_verified' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email već potvrđen
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Prijavi se
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Greška
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  to="/register"
                  className="block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Registruj se ponovo
                </Link>
                <Link
                  to="/"
                  className="block text-gray-600 hover:text-gray-800"
                >
                  Vrati se na početnu
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <PublicFooter />
    </>
  );
};
