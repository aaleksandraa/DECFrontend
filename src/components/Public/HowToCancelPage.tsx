import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { 
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export const HowToCancelPage: React.FC = () => {
  const steps = [
    {
      title: "Korak 1: Prijavite se na nalog",
      description: "Posjetite našu stranicu i prijavite se sa vašim email-om i lozinkom. Ako nemate nalog, a rezervisali ste kao gost, kontaktirajte salon direktno.",
      icon: "👤"
    },
    {
      title: "Korak 2: Idite na 'Moji termini'",
      description: "U vašem dashboardu pronađite sekciju 'Moji termini' ili 'Kalendar' gdje možete vidjeti sve vaše nadolazeće rezervacije.",
      icon: "📋"
    },
    {
      title: "Korak 3: Pronađite rezervaciju",
      description: "Pronađite rezervaciju koju želite otkazati. Možete filtrirati po datumu ili salonu.",
      icon: "🔍"
    },
    {
      title: "Korak 4: Kliknite na 'Otkaži'",
      description: "Kliknite na dugme 'Otkaži termin' i potvrdite da želite otkazati rezervaciju.",
      icon: "❌"
    },
    {
      title: "Korak 5: Potvrda otkazivanja",
      description: "Dobićete email potvrdu o uspješnom otkazivanju rezervacije. Salon će takođe biti obaviješten.",
      icon: "✉️"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Kako otkazati rezervaciju? | Frizerino</title>
        <meta name="description" content="Saznajte kako jednostavno otkazati rezervaciju u frizerskom ili kozmetičkom salonu putem Frizerino platforme." />
        <link rel="canonical" href="/pomoc/kako-otkazati-rezervaciju" />
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
              Kako otkazati rezervaciju?
            </h1>
            <p className="text-xl text-orange-100">
              Vodič za otkazivanje termina
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Important notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12">
            <div className="flex items-start gap-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Važna napomena</h3>
                <p className="text-amber-700">
                  Molimo vas da otkažete rezervaciju što je prije moguće ako niste u mogućnosti doći na termin. 
                  Ovo omogućava salonu da ponudi termin drugim klijentima i pomaže u održavanju dobrog odnosa sa salonima.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0 text-4xl">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cancellation policy */}
          <div className="mt-12 bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ClockIcon className="w-7 h-7 text-orange-600" />
              Politika otkazivanja
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">Više od 24 sata prije termina</h4>
                  <p className="text-green-700 text-sm">Možete slobodno otkazati bez ikakvih ograničenja.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800">Manje od 24 sata prije termina</h4>
                  <p className="text-amber-700 text-sm">Možete otkazati, ali molimo vas da pokušate kontaktirati salon direktno.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl">
                <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Nedolazak bez otkazivanja</h4>
                  <p className="text-red-700 text-sm">Česta nedolaženja mogu rezultirati ograničenjima u budućim rezervacijama.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guest cancellation */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
              <EnvelopeIcon className="w-6 h-6" />
              Rezervisali ste kao gost?
            </h2>
            <p className="text-blue-800 mb-4">
              Ako ste rezervisali termin bez naloga (kao gost), možete otkazati rezervaciju na sljedeće načine:
            </p>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                Kliknite na link za otkazivanje u email potvrdi rezervacije
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                Kontaktirajte salon direktno putem telefona
              </li>
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                Pošaljite nam poruku putem kontakt forme
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">
              Trebate pomoć?
            </h2>
            <p className="text-orange-100 mb-6">
              Ako imate problema sa otkazivanjem, kontaktirajte nas
            </p>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
            >
              <EnvelopeIcon className="w-5 h-5" />
              Kontaktirajte nas
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
};
