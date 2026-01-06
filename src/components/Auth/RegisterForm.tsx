import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { publicSettingsAPI } from '../../services/api';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'klijent' as 'klijent' | 'frizer' | 'salon'
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
  const [acceptContactCommunication, setAcceptContactCommunication] = useState(false);
  const [acceptPublicDataDisplay, setAcceptPublicDataDisplay] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [allowFrizerRegistration, setAllowFrizerRegistration] = useState(false);
  const { register, loading } = useAuth();

  // Fetch registration settings
  useEffect(() => {
    const fetchRegistrationSettings = async () => {
      try {
        const settings = await publicSettingsAPI.getRegistrationSettings();
        setAllowFrizerRegistration(settings.allow_frizer_registration || false);
      } catch (error) {
        console.log('Using default registration settings');
      }
    };
    fetchRegistrationSettings();
  }, []);

  // Get return URL from location state or default to dashboard
  const returnTo = (location.state as any)?.returnTo || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Frontend validacija
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Ime i prezime je obavezno';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email adresa je obavezna';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email adresa nije validna';
    }

    if (!password) {
      errors.password = 'Lozinka je obavezna';
    } else if (password.length < 8) {
      errors.password = 'Lozinka mora imati najmanje 8 karaktera';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'Lozinka mora sadržavati najmanje jedno veliko slovo';
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'Lozinka mora sadržavati najmanje jedno malo slovo';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'Lozinka mora sadržavati najmanje jedan broj';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Lozinke se ne poklapaju';
    }

    if (!acceptPrivacyPolicy) {
      errors.privacy = 'Morate prihvatiti pravila privatnosti i uslove korištenja';
    }

    if (!acceptContactCommunication) {
      errors.communication = 'Morate pristati na kontakt komunikaciju';
    }

    // Za salone i frizere - dodatna validacija
    if ((formData.role === 'salon' || formData.role === 'frizer') && !acceptPublicDataDisplay) {
      errors.publicDisplay = 'Morate pristati na javni prikaz vaših podataka';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(Object.values(errors)[0]); // Prikaži prvu grešku
      return;
    }

    try {
      const registrationData = {
        ...formData,
        accept_privacy_policy: acceptPrivacyPolicy,
        accept_contact_communication: acceptContactCommunication,
        accept_public_data_display: acceptPublicDataDisplay,
      };

      const success = await register(registrationData, password);
      if (success) {
        // Show verification message instead of navigating
        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Prikaži greške sa servera
      if (err.response?.data?.errors) {
        const serverErrors: Record<string, string> = {};
        Object.keys(err.response.data.errors).forEach(key => {
          const errorArray = err.response.data.errors[key];
          serverErrors[key] = Array.isArray(errorArray) ? errorArray[0] : errorArray;
        });
        setFieldErrors(serverErrors);
        
        // Prikaži prvu grešku kao glavni error message
        const firstError = Object.values(err.response.data.errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Greška pri registraciji. Molimo pokušajte ponovo.');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Show success message after registration
  if (registrationSuccess) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Provjerite vaš email!
          </h2>
          <p className="text-gray-600 mb-6">
            Poslali smo vam verifikacijski link na <strong>{formData.email}</strong>. 
            Kliknite na link u emailu da potvrdite vašu adresu i aktivirate nalog.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Napomena:</strong> Ako ne vidite email, provjerite folder za neželjenu poštu (spam).
            </p>
          </div>
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Vrati se na prijavu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Registracija</h2>
        <p className="text-gray-600 mt-2">Napravite novi nalog</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Ime i prezime *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
              fieldErrors.name 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Marko Petrović"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email adresa *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
              fieldErrors.email 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="marko@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefon
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+387 60 123 4567"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Tip korisnika
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="klijent">Klijent</option>
            {allowFrizerRegistration && <option value="frizer">Frizer</option>}
            <option value="salon">Vlasnik salona</option>
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Lozinka *
          </label>
          <div className="text-xs text-gray-500 mb-2">
            Mora sadržavati: najmanje 8 karaktera, jedno veliko slovo, jedno malo slovo i jedan broj
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent ${
                fieldErrors.password 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
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
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Potvrdite lozinku *
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
              fieldErrors.confirmPassword 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="••••••••"
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* GDPR Consents */}
        <div className="space-y-3 pt-2 border-t border-gray-200">
          {/* Privacy Policy */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptPrivacyPolicy}
              onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800">
              Prihvatam{' '}
              <Link to="/politika-privatnosti" target="_blank" className="text-blue-600 hover:underline">
                pravila privatnosti
              </Link>
              {' '}i{' '}
              <Link to="/uslovi-koristenja" target="_blank" className="text-blue-600 hover:underline">
                uslove korištenja
              </Link>
              {' '}platforme Frizerino. *
            </span>
          </label>

          {/* Contact Communication */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptContactCommunication}
              onChange={(e) => setAcceptContactCommunication(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800">
              Pristajem da saloni i administratori mogu koristiti moj email i telefon za komunikaciju 
              u vezi termina i usluga. *
            </span>
          </label>

          {/* Public Data Display - Only for salon and frizer */}
          {(formData.role === 'salon' || formData.role === 'frizer') && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={acceptPublicDataDisplay}
                onChange={(e) => setAcceptPublicDataDisplay(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800">
                Pristajem da se moji uneseni podaci (naziv, opis, fotografije, kontakt, radno vrijeme) 
                javno prikazuju na platformi Frizerino. *
              </span>
            </label>
          )}

          <p className="text-xs text-gray-500">* Obavezna polja</p>
        </div>

        <button
          type="submit"
          disabled={
            loading || 
            !formData.name.trim() || 
            !formData.email.trim() || 
            !password || 
            !confirmPassword ||
            !acceptPrivacyPolicy ||
            !acceptContactCommunication ||
            ((formData.role === 'salon' || formData.role === 'frizer') && !acceptPublicDataDisplay)
          }
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registracija...' : 'Registrujte se'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Već imate nalog?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Prijavite se
          </button>
        </p>
      </div>
    </div>
  );
}