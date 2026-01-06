import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // Get return URL from location state
  const returnTo = (location.state as any)?.returnTo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser) {
        // If there's a returnTo URL, use it
        if (returnTo) {
          navigate(returnTo, { replace: true });
        } else if (loggedInUser.role === 'klijent') {
          // Clients go to home page
          navigate('/', { replace: true });
        } else {
          // Salon owners and staff go to dashboard
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError('Neispravni podaci za prijavu');
      }
    } catch (err) {
      setError('Došlo je do greške prilikom prijave');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Prijava</h2>
        <p className="text-gray-600 mt-2">Prijavite se na svoj nalog</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email adresa
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="unesite@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Lozinka
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Prijavljivanje...' : 'Prijavite se'}
        </button>
      </form>

      <div className="mt-8">
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-3 text-center">Demo nalozi:</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Admin:</span>
              <code className="bg-gray-200 px-2 py-1 rounded text-xs">admin@salonbooking.ba</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Salon:</span>
              <code className="bg-gray-200 px-2 py-1 rounded text-xs">salon@example.com</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Frizer:</span>
              <code className="bg-gray-200 px-2 py-1 rounded text-xs">marija@example.com</code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Klijent:</span>
              <code className="bg-gray-200 px-2 py-1 rounded text-xs">ana@example.com</code>
            </div>
            <p className="text-center text-gray-400 mt-2">Lozinka: <code className="bg-gray-200 px-2 py-1 rounded">password</code></p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Nemate nalog?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Registrujte se
          </button>
        </p>
      </div>
    </div>
  );
}