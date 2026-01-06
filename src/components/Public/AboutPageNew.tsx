import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Sparkles,
  Filter,
  Target,
  ArrowRight,
  Users
} from 'lucide-react';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';

export function AboutPageNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const isClientsPage = location.pathname === '/za-klijente' || location.pathname === '/o-nama';
  const isSalonsPage = location.pathname === '/za-salone';
  const isAboutPage = location.pathname === '/o-platformi';

  // Scroll to content when tab changes (not on initial load)
  useEffect(() => {
    if (contentRef.current && location.pathname !== '/o-nama') {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.pathname]);

  const handleTabClick = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <>
      <MainNavbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300 opacity-10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Pronađite i rezervišite frizerski ili kozmetički salon
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Brzo, jednostavno i onda kada vama odgovara
          </p>
          <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto">
            Pretražite salone po gradu, usluzi, slobodnim terminima i lokaciji – i rezervišite online, bez poziva i čekanja
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pretraga"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Search className="w-5 h-5" />
              Pronađi slobodan termin
            </Link>
            <Link
              to="/registracija"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Registrujte salon
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Salona</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
              <div className="text-gray-600">Rezervacija</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-600 mb-2">50+</div>
              <div className="text-gray-600">Gradova</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">4.8★</div>
              <div className="text-gray-600">Prosječna ocjena</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pametna pretraga salona */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Napredna pretraga</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pametna pretraga salona
            </h2>
            <p className="text-xl text-gray-700 font-semibold max-w-3xl mx-auto mb-2">
              Frizerino je platforma za online zakazivanje frizera i kozmetičkih tretmana u Bosni i Hercegovini.
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Omogućava pretragu salona po više kriterijuma istovremeno
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Po gradu i naselju</h3>
              <p className="text-gray-600">Pretražite frizerske i kozmetičke salone u vašem gradu ili naselju</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Po blizini lokacije</h3>
              <p className="text-gray-600">Pronađite frizer u blizini vaše trenutne lokacije</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Po tipu salona</h3>
              <p className="text-gray-600">Muški, ženski ili dječiji frizerski saloni</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Po dostupnim terminima</h3>
              <p className="text-gray-600">Vidite slobodne termine i rezervišite odmah</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/pretraga"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Pronađi slobodan termin
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="py-6 md:py-8 bg-white border-b md:sticky md:top-0 z-10 md:shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Tabs */}
          <div className="hidden md:flex justify-center gap-4 flex-wrap">
            <Link
              to="/za-klijente"
              onClick={(e) => handleTabClick('/za-klijente', e)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isClientsPage
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Za klijente
            </Link>
            <Link
              to="/za-salone"
              onClick={(e) => handleTabClick('/za-salone', e)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isSalonsPage
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Za vlasnike salona
            </Link>
            <Link
              to="/o-platformi"
              onClick={(e) => handleTabClick('/o-platformi', e)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isAboutPage
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              O platformi
            </Link>
          </div>

          {/* Mobile Tabs - Vertical Stack */}
          <div className="md:hidden space-y-3">
            <Link
              to="/za-klijente"
              onClick={(e) => handleTabClick('/za-klijente', e)}
              className={`block w-full px-6 py-4 rounded-xl font-semibold transition-all text-center ${
                isClientsPage
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              Za klijente
            </Link>
            <Link
              to="/za-salone"
              onClick={(e) => handleTabClick('/za-salone', e)}
              className={`block w-full px-6 py-4 rounded-xl font-semibold transition-all text-center ${
                isSalonsPage
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              Za vlasnike salona
            </Link>
            <Link
              to="/o-platformi"
              onClick={(e) => handleTabClick('/o-platformi', e)}
              className={`block w-full px-6 py-4 rounded-xl font-semibold transition-all text-center ${
                isAboutPage
                  ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              O platformi
            </Link>
          </div>
        </div>
      </section>

      {/* Nested Route Content */}
      <div ref={contentRef}>
        <Outlet />
      </div>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Spremni da počnete?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Pridružite se stotinama salona i hiljadama zadovoljnih klijenata
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pretraga"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all inline-flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Pronađi slobodan termin
            </Link>
            <Link
              to="/registracija"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all inline-flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Registrujte salon
            </Link>
          </div>
        </div>
      </section>

        <PublicFooter />
      </div>
    </>
  );
}
