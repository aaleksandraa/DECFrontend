import React from 'react';
import { Link } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { 
  CalendarDaysIcon,
  UserGroupIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SparklesIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  ScissorsIcon,
  HeartIcon,
  BellAlertIcon,
  CogIcon,
  DocumentChartBarIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

export const AboutPage: React.FC = () => {
  const features = [
    {
      icon: CalendarDaysIcon,
      title: 'Online zakazivanje',
      description: 'Klijenti mogu zakazati termine 24/7 putem intuitivnog interfejsa, bez potrebe za telefonskim pozivima.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Upravljanje osobljem',
      description: 'Dodajte frizere, definišite njihove radne sate, pauze i godišnje odmore jednostavno i pregledno.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: ScissorsIcon,
      title: 'Katalog usluga',
      description: 'Kreirajte detaljne usluge sa cijenama, trajanjem i kategorijama. Povežite usluge sa određenim frizerima.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Analitika i izvještaji',
      description: 'Pratite performanse salona, najpopularnije usluge, prihode i zauzetost frizera u realnom vremenu.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: BellAlertIcon,
      title: 'Automatski podsjetnici',
      description: 'Sistem automatski šalje podsjetnike klijentima prije termina, smanjujući broj propuštenih rezervacija.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Responzivan dizajn',
      description: 'Aplikacija savršeno radi na svim uređajima - desktop računarima, tabletima i mobilnim telefonima.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: GlobeAltIcon,
      title: 'Widget za integraciju',
      description: 'Ugradite widget za rezervacije na vašu postojeću web stranicu i dozvolite klijentima da rezervišu direktno.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'GDPR usklađenost',
      description: 'Potpuna usklađenost sa GDPR regulativama. Vaši podaci i podaci vaših klijenata su sigurni.',
      color: 'from-emerald-500 to-green-500'
    }
  ];

  const benefits = [
    {
      icon: ClockIcon,
      title: 'Ušteda vremena',
      description: 'Automatizirajte zakazivanje i smanjite vrijeme provedeno na telefonu.'
    },
    {
      icon: HeartIcon,
      title: 'Zadovoljni klijenti',
      description: 'Pružite moderan i profesionalan doživljaj svojim klijentima.'
    },
    {
      icon: DocumentChartBarIcon,
      title: 'Bolji uvid u poslovanje',
      description: 'Donosite odluke bazirane na stvarnim podacima i analitici.'
    },
    {
      icon: CogIcon,
      title: 'Lako upravljanje',
      description: 'Intuitivno sučelje koje ne zahtijeva tehničko znanje.'
    }
  ];

  const stats = [
    { value: '500+', label: 'Registrovanih salona' },
    { value: '10,000+', label: 'Uspješnih rezervacija' },
    { value: '98%', label: 'Zadovoljnih korisnika' },
    { value: '24/7', label: 'Dostupnost sistema' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
            <SparklesIcon className="h-5 w-5" />
            Moderna platforma za frizerske salone
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            O nama - Frizerino
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Web aplikacija namijenjena za upravljanje frizerskim salonima, 
            koja omogućava lako i efikasno zakazivanje termina, upravljanje uslugama, 
            frizerima i klijentima.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Naša misija
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Frizerino je nastao iz želje da frizerski saloni u Bosni i Hercegovini, 
                te široj regiji, dobiju pristup modernim alatima za upravljanje svojim poslovanjem 
                - alatima koji su do sada bili dostupni samo velikim lancima salona.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Naš cilj je <strong>digitalizacija frizerske industrije</strong> i omogućavanje 
                vlasnicima salona da se fokusiraju na ono što rade najbolje - pružanje izvanredne 
                usluge svojim klijentima, dok se Frizerino brine o ostatku.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                  Lokalni proizvod
                </span>
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Bosna i Hercegovina
                </span>
                <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  Made with ❤️
                </span>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 text-center shadow-lg">
                      <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                        {stat.value}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Šta Frizerino nudi?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kompletan set alata za upravljanje modernim frizerskim salonom
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* For Who Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Za koga je Frizerino?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Salon Owners */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-8 border border-pink-100">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6">
                <BuildingStorefrontIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Vlasnike salona</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Pregled svih rezervacija na jednom mjestu</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Analitika i izvještaji o poslovanju</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Upravljanje osobljem i uslugama</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Profesionalan online profil salona</span>
                </li>
              </ul>
            </div>

            {/* Hairdressers */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                <ScissorsIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Frizere</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Pregled ličnog rasporeda</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Upravljanje pauzama i odmorima</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Notifikacije o novim rezervacijama</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Pregled recenzija klijenata</span>
                </li>
              </ul>
            </div>

            {/* Clients */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 border border-orange-100">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Klijente</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Lako pronalaženje salona u blizini</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Brza rezervacija termina online</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Podsjetnici prije termina</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">Ostavljanje recenzija i ocjena</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prednosti korištenja Frizerino platforme
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Pridružite se stotinama salona koji su već unaprijedili svoje poslovanje
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-12 border border-emerald-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                  <LockClosedIcon className="h-4 w-4" />
                  Sigurnost i privatnost
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  GDPR usklađenost i sigurnost podataka
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Frizerino je u potpunosti usklađen sa GDPR regulativama Evropske unije. 
                  Svi podaci su enkriptirani, a pristup je strogo kontrolisan. Vaši podaci 
                  i podaci vaših klijenata su u sigurnim rukama.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span className="text-gray-700">SSL enkripcija svih podataka</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span className="text-gray-700">Redovno sigurnosno kopiranje</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span className="text-gray-700">Pravo na brisanje podataka</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <span className="text-gray-700">Transparentna politika privatnosti</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-48 h-48 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                    <ShieldCheckIcon className="h-24 w-24 text-white" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <LockClosedIcon className="h-10 w-10 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Spremni da unaprijedite svoj salon?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Pridružite se Frizerino platformi danas i počnite primati online rezervacije.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-pink-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Registrujte svoj salon
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              Pretražite salone
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default AboutPage;
