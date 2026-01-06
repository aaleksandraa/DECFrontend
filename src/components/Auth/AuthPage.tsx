import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Scissors, Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salonAPI, authAPI, publicSettingsAPI } from '../../services/api';

interface AuthPageProps {
  mode: 'login' | 'register';
}

// Salon background images - will be fetched from API
const fallbackImages = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1920&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80',
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1920&q=80',
  'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1920&q=80',
];

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [backgroundImages, setBackgroundImages] = useState<string[]>(fallbackImages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'klijent' as 'klijent' | 'frizer' | 'salon'
  });

  // GDPR consent states
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
  const [acceptContactCommunication, setAcceptContactCommunication] = useState(false);
  const [acceptPublicDataDisplay, setAcceptPublicDataDisplay] = useState(false);

  // Registration settings
  const [allowFrizerRegistration, setAllowFrizerRegistration] = useState(false);

  const returnTo = (location.state as any)?.returnTo;



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

  // Fetch salon images for background
  useEffect(() => {
    const fetchSalonImages = async () => {
      try {
        const response = await salonAPI.getSalons();
        const salons = response.data || response;
        const images: string[] = [];
        
        salons.forEach((salon: any) => {
          if (salon.cover_image) {
            images.push(salon.cover_image);
          }
          if (salon.images && Array.isArray(salon.images)) {
            salon.images.forEach((img: any) => {
              if (img.image_url) {
                images.push(img.image_url);
              }
            });
          }
        });
        
        if (images.length > 0) {
          // Shuffle and take up to 10 images
          const shuffled = images.sort(() => Math.random() - 0.5).slice(0, 10);
          setBackgroundImages(shuffled);
        }
      } catch (error) {
        console.log('Using fallback images');
      }
    };
    
    fetchSalonImages();
  }, []);

  // Rotate background images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Redirect if already logged in - but DON'T auto-redirect on login page
  // This prevents security issue where clicking email verification link while logged in as admin
  // would redirect to admin dashboard instead of showing login form
  useEffect(() => {
    if (user && mode === 'register') {
      // Only auto-redirect on register page, not login page
      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else {
        navigate(user.role === 'klijent' ? '/' : '/dashboard', { replace: true });
      }
    }
  }, [user, navigate, returnTo, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(null);
    setIsLoading(true);

    try {
      const loggedInUser = await login(loginData.email, loginData.password);
      if (loggedInUser) {
        if (returnTo) {
          navigate(returnTo, { replace: true });
        } else if (loggedInUser.role === 'klijent') {
          navigate('/', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError('Neispravni podaci za prijavu');
      }
    } catch (err: any) {
      if (err.response?.data?.email_not_verified) {
        setEmailNotVerified(err.response.data.email);
      } else if (err.response?.status === 429) {
        setError('Previše pokušaja prijave. Molimo sačekajte par minuta.');
      } else {
        setError(err.response?.data?.message || 'Neispravni podaci za prijavu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const handleResendVerification = async () => {
    if (!emailNotVerified) return;
    
    setResendingEmail(true);
    setError('');
    setVerificationEmailSent(false);
    
    try {
      await authAPI.resendVerificationEmail(emailNotVerified);
      setError('');
      setVerificationEmailSent(true);
      // Don't clear emailNotVerified - keep the box visible with success message
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Previše pokušaja. Molimo sačekajte par minuta prije ponovnog slanja.');
      } else {
        setError(err.response?.data?.message || 'Greška pri slanju verifikacijskog emaila.');
      }
    } finally {
      setResendingEmail(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(null); // Clear email not verified state

    if (registerData.password !== registerData.confirmPassword) {
      setError('Lozinke se ne poklapaju');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (registerData.password.length < 8) {
      setError('Lozinka mora imati najmanje 8 karaktera');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!/[A-Z]/.test(registerData.password)) {
      setError('Lozinka mora sadržavati najmanje jedno veliko slovo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!/[a-z]/.test(registerData.password)) {
      setError('Lozinka mora sadržavati najmanje jedno malo slovo');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!/[0-9]/.test(registerData.password)) {
      setError('Lozinka mora sadržavati najmanje jedan broj');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // GDPR validacija
    if (!acceptPrivacyPolicy) {
      setError('Morate prihvatiti pravila privatnosti i uslove korištenja');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!acceptContactCommunication) {
      setError('Morate pristati na kontakt komunikaciju');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Za salone i frizere - dodatna validacija
    if ((registerData.role === 'salon' || registerData.role === 'frizer') && !acceptPublicDataDisplay) {
      setError('Morate pristati na javni prikaz vaših podataka');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(
        {
          name: registerData.name,
          email: registerData.email,
          phone: registerData.phone,
          role: registerData.role,
          accept_privacy_policy: acceptPrivacyPolicy,
          accept_contact_communication: acceptContactCommunication,
          accept_public_data_display: acceptPublicDataDisplay,
        } as any,
        registerData.password
      );

      if (success) {
        // Redirect na stranicu za uspješnu registraciju
        navigate('/registration-success', { 
          state: { email: registerData.email },
          replace: true 
        });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Došlo je do greške prilikom registracije. Molimo pokušajte ponovo.';
      
      // Prikaži greške sa servera
      if (err.response?.data?.errors) {
        // Prikaži prvu grešku iz validacije
        const errors = err.response.data.errors;
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = errors[firstErrorKey];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      // Use flushSync to force synchronous state update
      flushSync(() => {
        setIsLoading(false);
        setError(errorMessage);
      });
      
      // Scroll to top after state is set
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      // Ensure loading is always set to false
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background with salon images */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background images with transition */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt="Salon"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
        
        {/* Content over background */}
        <div className="relative z-10 flex flex-col justify-between p-8 lg:p-12 text-white h-full">
          {/* Logo/Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Frizerino</span>
            </Link>
          </div>
          
          {/* Middle content */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Online zakazivanje frizera i kozmetičkih tretmana
            </h1>
            <p className="text-lg xl:text-xl text-gray-200 mb-8">
              Rezervišite termine u najboljim frizerskim i kozmetičkim salonima. 
              Brzo, jednostavno i bez telefonskih poziva.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg">Besplatna rezervacija termina </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg">Provjerene recenzije stvarnih klijenata</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg">Podsjetnici da nikada ne zaboravite termin</span>
              </div>
            </div>
          </div>
          
          {/* Image indicators */}
          <div className="flex gap-2">
            {backgroundImages.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex % 5 
                    ? 'w-8 bg-white' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col bg-gray-50">
        {/* Mobile header */}
        <div className="lg:hidden bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span>Nazad</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">Frizerino</span>
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Back button - desktop only */}
            <Link 
              to="/" 
              className="hidden lg:inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Nazad na početnu</span>
            </Link>

            {/* Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {mode === 'login' ? 'Dobrodošli nazad' : 'Kreirajte nalog'}
              </h2>
              <p className="text-gray-600 mt-2">
                {mode === 'login' 
                  ? 'Prijavite se na svoj nalog' 
                  : 'Registrujte se za besplatno'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div 
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2"
                style={{ 
                  backgroundColor: '#fee', 
                  border: '3px solid #f00', 
                  color: '#900',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  zIndex: 9999,
                  position: 'relative'
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Email not verified message */}
            {emailNotVerified && (
              <div className={`border px-4 py-4 rounded-xl mb-6 ${
                verificationEmailSent 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-start gap-3">
                  {verificationEmailSent ? (
                    <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div className="flex-1">
                    {verificationEmailSent ? (
                      <>
                        <p className="font-medium mb-1">Email je poslan!</p>
                        <p className="text-sm mb-3">
                          Verifikacijski email je poslan na <strong>{emailNotVerified}</strong>. 
                          Provjerite vaš inbox i spam folder.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailNotVerified(null);
                            setVerificationEmailSent(false);
                          }}
                          className="text-sm font-medium text-green-700 hover:text-green-900 underline"
                        >
                          Zatvori
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="font-medium mb-1">Email adresa nije potvrđena</p>
                        <p className="text-sm mb-3">
                          Molimo potvrdite vašu email adresu ({emailNotVerified}) prije prijave.
                        </p>
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resendingEmail}
                          className="text-sm font-medium text-amber-700 hover:text-amber-900 underline disabled:opacity-50"
                        >
                          {resendingEmail ? 'Šaljem...' : 'Pošalji verifikacijski email ponovo'}
                        </button>
                        {error && (
                          <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Already logged in warning */}
            {mode === 'login' && user && (
              <div className="bg-amber-50 border-2 border-amber-400 text-amber-900 px-4 py-4 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-bold mb-2">⚠️ Već ste prijavljeni</p>
                    <p className="text-sm mb-3">
                      Trenutno ste prijavljeni kao <strong>{user.name}</strong> ({user.role}).
                      {' '}Da biste se prijavili kao drugi korisnik, morate se prvo odjaviti.
                    </p>
                    <div className="flex gap-3">
                      <Link
                        to="/dashboard"
                        className="text-sm font-medium px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Idi na Dashboard
                      </Link>
                      <Link
                        to="/"
                        className="text-sm font-medium px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Početna
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' && !emailNotVerified && !user && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email adresa
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="vas@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lozinka
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Prijavljivanje...
                    </span>
                  ) : 'Prijavite se'}
                </button>

                <div className="text-center">
                  <Link
                    to="/zaboravljena-lozinka"
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Zaboravili ste lozinku?
                  </Link>
                </div>
              </form>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ime i prezime
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Marko Petrović"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email adresa
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="vas@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon <span className="text-gray-400">(opciono)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="+387 60 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tip korisnika
                  </label>
                  <div className={`grid gap-2 ${allowFrizerRegistration ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {[
                      { value: 'klijent', label: 'Klijent', icon: '👤' },
                      ...(allowFrizerRegistration ? [{ value: 'frizer', label: 'Frizer', icon: '✂️' }] : []),
                      { value: 'salon', label: 'Salon', icon: '🏪' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRegisterData({ ...registerData, role: option.value as any })}
                        className={`py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${
                          registerData.role === option.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mb-1 block">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lozinka
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    Mora sadržavati: najmanje 8 karaktera, jedno veliko slovo, jedno malo slovo i jedan broj
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Potvrdite lozinku
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* GDPR Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptPrivacyPolicy}
                      onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
                      className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800">
                      Prihvatam{' '}
                      <Link to="/politika-privatnosti" target="_blank" className="text-orange-600 hover:underline">
                        pravila privatnosti
                      </Link>{' '}
                      i{' '}
                      <Link to="/uslovi-koristenja" target="_blank" className="text-orange-600 hover:underline">
                        uslove korištenja
                      </Link>
                      <span className="text-red-500">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptContactCommunication}
                      onChange={(e) => setAcceptContactCommunication(e.target.checked)}
                      className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800">
                      Pristajem da saloni i administratori mogu koristiti moj email i telefon za komunikaciju u vezi termina
                      <span className="text-red-500">*</span>
                    </span>
                  </label>

                  {(registerData.role === 'salon' || registerData.role === 'frizer') && (
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acceptPublicDataDisplay}
                        onChange={(e) => setAcceptPublicDataDisplay(e.target.checked)}
                        className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-gray-800">
                        Pristajem da se moji podaci (ime, lokacija, usluge, kontakt) javno prikazuju na platformi
                        <span className="text-red-500">*</span>
                      </span>
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Registracija...
                    </span>
                  ) : 'Registrujte se'}
                </button>
              </form>
            )}

            {/* Toggle mode - hide when email not verified */}
            {!emailNotVerified && (
              <p className="text-center mt-8 text-gray-600">
                {mode === 'login' ? (
                  <>
                    Nemate nalog?{' '}
                    <Link 
                      to="/register" 
                      state={location.state}
                      className="text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Registrujte se
                    </Link>
                  </>
                ) : (
                  <>
                    Već imate nalog?{' '}
                    <Link 
                      to="/login" 
                      state={location.state}
                      className="text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Prijavite se
                    </Link>
                  </>
                )}
              </p>
            )}

            {/* Back to login button when email not verified */}
            {emailNotVerified && (
              <button
                type="button"
                onClick={() => setEmailNotVerified(null)}
                className="w-full mt-6 text-center text-gray-600 hover:text-gray-800"
              >
                ← Nazad na prijavu
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-gray-500">
          © 2025 Frizerino.com. Sva prava zadržana.
        </div>
      </div>
    </div>
  );
}
