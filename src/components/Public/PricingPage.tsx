import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { 
  CheckIcon,
  SparklesIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BellIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

export const PricingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const features = [
    { icon: CalendarDaysIcon, text: 'Online zakazivanje termina 24/7' },
    { icon: UserGroupIcon, text: 'Upravljanje osobljem i uslugama' },
    { icon: ChartBarIcon, text: 'Statistika i izvještaji' },
    { icon: BellIcon, text: 'Automatske notifikacije klijentima' },
    { icon: CreditCardIcon, text: 'Praćenje prihoda' },
    { icon: SparklesIcon, text: 'Profil salona sa slikama' }
  ];

  return (
    <>
      <Helmet>
        <title>Cjenovnik | Frizerino – Transparentne cijene za salone</title>
        <meta name="description" content="Probajte Frizerino besplatno prvi mjesec. Zatim samo 10-20 KM mjesečno zavisno od broja zaposlenih. Bez skrivenih troškova." />
        <link rel="canonical" href="https://frizerino.com/cjenovnik" />
        
        {/* Schema.org - PriceSpecification */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Frizerino - Online zakazivanje za salone",
            "description": "Platforma za online zakazivanje termina u frizerskim i kozmetičkim salonima",
            "brand": {
              "@type": "Brand",
              "name": "Frizerino"
            },
            "offers": [
              {
                "@type": "Offer",
                "name": "Standardni Paket - Mjesečno",
                "description": "Za salone do 3 zaposlena",
                "price": "15",
                "priceCurrency": "BAM",
                "priceValidUntil": "2025-12-31",
                "availability": "https://schema.org/InStock",
                "billingIncrement": "P1M"
              },
              {
                "@type": "Offer",
                "name": "Standardni Paket - Godišnje",
                "description": "Za salone do 3 zaposlena - ušteda 300 KM",
                "price": "180",
                "priceCurrency": "BAM",
                "priceValidUntil": "2025-12-31",
                "availability": "https://schema.org/InStock",
                "billingIncrement": "P1Y"
              },
              {
                "@type": "Offer",
                "name": "PLUS Paket",
                "description": "Za salone sa 4-7 zaposlenih",
                "price": "25",
                "priceCurrency": "BAM",
                "priceValidUntil": "2025-12-31",
                "availability": "https://schema.org/InStock",
                "billingIncrement": "P1M"
              },
              {
                "@type": "Offer",
                "name": "PRO Paket",
                "description": "Za salone sa 8-15 zaposlenih",
                "price": "35",
                "priceCurrency": "BAM",
                "priceValidUntil": "2025-12-31",
                "availability": "https://schema.org/InStock",
                "billingIncrement": "P1M"
              }
            ]
          })}
        </script>
      </Helmet>

      <MainNavbar />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Softver koji zamjenjuje svesku, telefon i haos u rezervacijama
            </h1>
            <p className="text-xl text-orange-100 max-w-3xl mx-auto mb-6">
              Bez skrivenih troškova. Bez ugovora. Otkažite bilo kada.
            </p>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <SparklesIcon className="w-6 h-6" />
              <span className="font-semibold text-lg">Isprobaj 30 dana besplatno</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Free Trial Banner */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 rounded-2xl p-8 mb-12 text-center shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4 shadow-md animate-bounce">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Isprobaj 30 dana besplatno – bez obaveza
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-4">
              Testirajte sve funkcionalnosti platforme bez ikakvih obaveza. 
              Odlučite da li je Frizerino pravo rješenje za vaš salon.
            </p>
            <p className="text-base text-gray-600 max-w-2xl mx-auto mb-6 font-medium">
              Već nakon 2–3 online rezervacije mjesečno, Frizerino se sam isplati.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium">Bez kreditne kartice</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium">Bez ugovora</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <CheckIcon className="w-5 h-5 text-green-600" />
                <span className="font-medium">Otkažite bilo kada</span>
              </div>
            </div>
          </div>

          {/* Main Pricing Card - Centered and Large */}
          <div className="max-w-3xl mx-auto mb-16">
            {/* Pricing Toggle - Monthly vs Yearly */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-full p-1.5 shadow-lg inline-flex gap-1 relative">
                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 relative z-10 ${
                    !isYearly 
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mjesečno
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 relative z-10 ${
                    isYearly 
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Godišnje
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-black shadow-md animate-pulse">
                    -62%
                  </span>
                </button>
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 transform hover:scale-[1.02] transition-all duration-500 hover:shadow-orange-200">
              {/* Badge */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2.5 text-sm font-semibold animate-gradient">
                🎄 Novogodišnja akcija – Zaključaj cijenu sada!
              </div>
              
              {/* Header */}
              <div className="bg-gradient-to-br from-orange-50 via-red-50 to-orange-50 p-8 text-center border-b border-orange-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Standardni Paket</h2>
                <p className="text-gray-600 text-lg">Za salone do 3 zaposlena</p>
              </div>
              
              {/* Pricing */}
              <div className="p-8 bg-white">
                <div className="text-center mb-8">
                  {!isYearly ? (
                    // Monthly Pricing
                    <div className="transition-all duration-500 animate-fadeIn">
                      {/* Static Discount Badge - Always Visible */}
                      <div className="mb-6">
                        <div className="inline-block bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-black text-lg md:text-xl shadow-lg">
                          🔥 -60% POPUST
                        </div>
                      </div>
                      
                      {/* Price Display - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
                        {/* Old Price */}
                        <div className="text-center">
                          
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl sm:text-5xl text-gray-400 line-through font-black">39</span>
                            <span className="text-base sm:text-lg text-gray-400 ml-1">KM</span>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <div className="text-4xl sm:text-5xl text-orange-400 font-thin">→</div>
                        
                        {/* New Price */}
                        <div className="text-center">
                          <div className="flex items-baseline justify-center">
                            <span className="text-7xl sm:text-8xl md:text-9xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent leading-none">
                              15
                            </span>
                            <span className="text-2xl sm:text-3xl font-bold text-gray-600 ml-2">KM</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-base sm:text-lg mb-6 font-semibold">mjesečno</p>
                      
                      {/* Savings Badge - No Icon */}
                      <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-full px-6 py-3 shadow-md">
                        <span className="text-green-700 font-black text-base sm:text-lg">Ušteda 288 KM godišnje</span>
                      </div>
                    </div>
                  ) : (
                    // Yearly Pricing
                    <div className="transition-all duration-500 animate-fadeIn">
                      {/* Static Discount Badge - Always Visible */}
                      <div className="mb-6">
                        <div className="inline-block bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-black text-lg md:text-xl shadow-lg">
                          🔥 -62% POPUST
                        </div>
                      </div>
                      
                      {/* Price Display - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
                        {/* Old Price */}
                        <div className="text-center">                          
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl sm:text-5xl text-gray-400 line-through font-black">468</span>
                            <span className="text-base sm:text-lg text-gray-400 ml-1">KM</span>
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <div className="text-4xl sm:text-5xl text-orange-400 font-thin">→</div>
                        
                        {/* New Price */}
                        <div className="text-center">                          
                          <div className="flex items-baseline justify-center">
                            <span className="text-7xl sm:text-8xl md:text-9xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 bg-clip-text text-transparent leading-none">
                              180
                            </span>
                            <span className="text-2xl sm:text-3xl font-bold text-gray-600 ml-2">KM</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-base sm:text-lg mb-6 font-semibold">godišnje (15 KM/mjesec)</p>
                      
                      {/* Savings Badge - No Icon */}
                      <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-full px-6 py-3 shadow-lg">
                        <span className="text-green-700 font-black text-base sm:text-lg">Ušteda 288 KM godišnje</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features - 2 columns on desktop, 1 on mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 group cursor-default"
                        style={{ 
                          animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
                        }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-gray-700 text-sm font-medium">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <Link
                  to="/register"
                  className="block w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-center py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02]"
                >
                  Počni besplatno – bez obaveza
                </Link>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Bez kreditne kartice • Otkažite bilo kada
                </p>
                <p className="text-center text-xs text-gray-600 mt-2 italic">
                  Već nakon 2–3 online rezervacije mjesečno, Frizerino se sam isplati.
                </p>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes slideInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            
            .animate-fadeIn {
              animation: fadeIn 0.5s ease-in-out;
            }
            
            @keyframes gradient {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
            
            .animate-gradient {
              background-size: 200% 200%;
              animation: gradient 3s ease infinite;
            }
          `}</style>

          {/* Additional Plans - Text Based */}
          <div className="max-w-5xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Paketi za veće salone
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PLUS Package */}
              <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 hover:border-orange-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">PLUS Paket</h4>
                  <p className="text-gray-600 text-sm mb-3">4-7 zaposlenih</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-lg text-gray-400 line-through">60</span>
                    <span className="text-4xl font-bold text-orange-600">25</span>
                    <span className="text-sm text-gray-600">KM/mj</span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Godišnje: 300 KM
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Sve standardne funkcionalnosti</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Idealno za salone sa više radnika</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Veći broj termina</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-xl font-semibold transition-all duration-300 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Počni besplatno
                </Link>
              </div>

              {/* PRO Package */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-400 p-6 hover:border-orange-500 hover:shadow-2xl transition-all duration-300 relative transform hover:-translate-y-2 scale-105">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                  ⭐ Preporučeno
                </div>
                <div className="mb-4 mt-2">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">PRO Paket</h4>
                  <p className="text-gray-600 text-sm mb-3">8-15 zaposlenih</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-lg text-gray-400 line-through">80</span>
                    <span className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">35</span>
                    <span className="text-sm text-gray-600">KM/mj</span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Godišnje: po dogovoru
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Sve PLUS funkcionalnosti</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Prioritetna podrška</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Brži onboarding</span>
                  </li>
                </ul>
                <Link
                  to="/register"
                  className="block w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-center py-3 rounded-xl font-semibold transition-all duration-300 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Počni besplatno
                </Link>
              </div>

              {/* ENTERPRISE Package */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md border-2 border-gray-300 p-6 hover:border-gray-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-1">ENTERPRISE</h4>
                  <p className="text-gray-600 text-sm mb-3">15+ zaposlenih</p>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    Custom
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Prilagođeno vašim potrebama
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Sve PRO funkcionalnosti</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Dedicirani account manager</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Custom integracije</span>
                  </li>
                </ul>
                <Link
                  to="/kontakt"
                  className="block w-full bg-gray-800 hover:bg-gray-900 text-white text-center py-3 rounded-xl font-semibold transition-all duration-300 text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Kontaktirajte nas
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Često postavljana pitanja
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group">
                <h3 className="font-bold text-gray-900 mb-2 text-base group-hover:text-orange-600 transition-colors">
                  Šta je uključeno u besplatni probni period?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Sve funkcionalnosti platforme su dostupne tokom 30 dana besplatnog perioda. 
                  Nema ograničenja ni skrivenih troškova.
                </p>
              </div>

              <div className="group">
                <h3 className="font-bold text-gray-900 mb-2 text-base group-hover:text-orange-600 transition-colors">
                  Da li moram unijeti podatke kreditne kartice?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Ne, za besplatni probni period nije potrebna kreditna kartica. 
                  Plaćanje se aktivira tek nakon što odlučite nastaviti korištenje.
                </p>
              </div>

              <div className="group">
                <h3 className="font-bold text-gray-900 mb-2 text-base group-hover:text-orange-600 transition-colors">
                  Mogu li otkazati pretplatu bilo kada?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Da, možete otkazati pretplatu bilo kada bez ikakvih penala. 
                  Nema ugovora ni obaveza.
                </p>
              </div>

              <div className="group">
                <h3 className="font-bold text-gray-900 mb-2 text-base group-hover:text-orange-600 transition-colors">
                  Kako se vrši plaćanje?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Plaćanje se vrši mjesečno ili godišnje putem bankovnog transfera ili 
                  kreditne kartice. Dobijate fakturu za svaku uplatu.
                </p>
              </div>

              <div className="group">
                <h3 className="font-bold text-gray-900 mb-2 text-base group-hover:text-orange-600 transition-colors">
                  Šta ako imam više od 3 zaposlena?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Za salone sa 4-7 zaposlenih cijena je 25 KM mjesečno (PLUS paket). 
                  Za 8-15 zaposlenih 35 KM mjesečno (PRO paket). 
                  Za veće salone kontaktirajte nas za prilagođenu ponudu.
                </p>
              </div>

              <div className="group">
                <h3 className="font-bold text-gray-900 mb-2 text-base group-hover:text-orange-600 transition-colors">
                  Koliko brzo vidim korist?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Većina salona vidi manje praznih termina i manje poziva već u prvoj sedmici korištenja. 
                  Klijenti mogu zakazati 24/7 bez poziva.
                </p>
              </div>

              <div className="group md:col-span-2 bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2 text-base flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 text-orange-600" />
                  Koliko traje novogodišnja akcija?
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed font-medium">
                  Akcijske cijene važe do kraja januara 2025. Nakon toga cijene se vraćaju na redovne 
                  (39 KM/mjesec za standardni paket). Zaključajte cijenu sada!
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300 animate-gradient">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Spremni za digitalizaciju vašeg salona?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Pridružite se stotinama salona koji već koriste Frizerino za upravljanje rezervacijama
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 inline-block shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
              >
                Isprobaj 30 dana besplatno
              </Link>
              <Link
                to="/kontakt"
                className="bg-orange-700/80 hover:bg-orange-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 inline-block border-2 border-white/30 hover:border-white/50 transform hover:-translate-y-1"
              >
                Kontaktirajte nas
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
};

export default PricingPage;
