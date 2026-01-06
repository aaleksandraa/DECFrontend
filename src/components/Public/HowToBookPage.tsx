import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { 
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

export const HowToBookPage: React.FC = () => {
  const steps = [
    {
      icon: MagnifyingGlassIcon,
      title: "1. Pretražite salone",
      description: "Koristite pretragu na početnoj stranici da pronađete salon u vašem gradu. Možete filtrirati po lokaciji, uslugama ili ocjenama.",
      image: "🔍"
    },
    {
      icon: BuildingStorefrontIcon,
      title: "2. Odaberite salon",
      description: "Pregledajte profile salona, pogledajte fotografije, pročitajte recenzije i odaberite salon koji vam odgovara.",
      image: "🏪"
    },
    {
      icon: UserIcon,
      title: "3. Odaberite uslugu i frizera",
      description: "Izaberite željenu uslugu iz menija i odaberite frizera ili kozmetičara kod kojeg želite zakazati termin.",
      image: "✂️"
    },
    {
      icon: CalendarIcon,
      title: "4. Odaberite datum",
      description: "Pregledajte dostupne datume u kalendaru i odaberite dan koji vam odgovara za posjetu salonu.",
      image: "📅"
    },
    {
      icon: ClockIcon,
      title: "5. Odaberite vrijeme",
      description: "Sistem će vam prikazati sve dostupne termine za odabrani dan. Odaberite vrijeme koje vam najbolje odgovara.",
      image: "⏰"
    },
    {
      icon: CheckCircleIcon,
      title: "6. Potvrdite rezervaciju",
      description: "Pregledajte detalje rezervacije i potvrdite. Dobićete email potvrdu sa svim detaljima vašeg termina.",
      image: "✅"
    }
  ];

  const tips = [
    {
      icon: DevicePhoneMobileIcon,
      title: "Rezervišite bilo kada",
      description: "Naša platforma radi 24/7, tako da možete zakazati termin u bilo koje doba dana ili noći."
    },
    {
      icon: CalendarIcon,
      title: "Podsjećanje na termin",
      description: "Dan prije termina dobićete email podsjetnik sa svim detaljima vaše rezervacije."
    },
    {
      icon: UserIcon,
      title: "Napravite nalog",
      description: "Sa nalogom možete pratiti sve svoje rezervacije, ostavljati recenzije i brže zakazivati nove termine."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Kako zakazati termin? | Frizerino</title>
        <meta name="description" content="Naučite kako jednostavno zakazati termin u frizerskom ili kozmetičkom salonu putem Frizerino platforme." />
        <link rel="canonical" href="/pomoc/kako-zakazati-termin" />
      </Helmet>

      <MainNavbar />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/kontakt" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-6 transition-colors">
              <ArrowLeftIcon className="w-4 h-4" />
              Nazad na kontakt
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Kako zakazati termin?
            </h1>
            <p className="text-xl text-orange-100">
              Jednostavan vodič za rezervaciju termina u salonu
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Steps */}
          <div className="grid gap-6">
            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0 text-4xl">
                    {step.image}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 ml-13">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Korisni savjeti
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {tips.map((tip, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <tip.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Guest booking info */}
          <div className="mt-12 bg-blue-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">
              ℹ️ Rezervacija bez naloga
            </h2>
            <p className="text-blue-800 mb-4">
              Možete zakazati termin i bez kreiranja naloga. Prilikom rezervacije samo unesite svoje ime, email i broj telefona. 
              Potvrdu rezervacije ćete dobiti na email.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Napomena:</strong> Sa nalogom imate pristup historiji rezervacija, možete lakše otkazivati termine i ostavljati recenzije.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">
              Spremni za rezervaciju?
            </h2>
            <p className="text-orange-100 mb-6">
              Pronađite savršen salon i zakažite termin u nekoliko klikova
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              Pretražite salone
            </Link>
          </div>

          {/* Help */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Imate problema sa rezervacijom?{' '}
              <Link to="/kontakt" className="text-orange-600 hover:underline font-medium">
                Kontaktirajte nas
              </Link>
            </p>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
};
