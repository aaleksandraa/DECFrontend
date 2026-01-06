import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { 
  UserPlusIcon,
  BuildingStorefrontIcon,
  CogIcon,
  UsersIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export const HowToRegisterSalonPage: React.FC = () => {
  const steps = [
    {
      icon: UserPlusIcon,
      title: "1. Kreirajte nalog",
      description: "Posjetite našu stranicu za registraciju i kreirajte nalog. Prilikom registracije odaberite opciju 'Vlasnik salona' kao tip korisnika.",
      tips: [
        "Koristite poslovni email za registraciju",
        "Zapamtite ili sačuvajte lozinku na sigurno mjesto",
        "Unesite tačan broj telefona za komunikaciju"
      ]
    },
    {
      icon: BuildingStorefrontIcon,
      title: "2. Dodajte informacije o salonu",
      description: "Nakon registracije, popunite profil vašeg salona sa svim potrebnim informacijama - naziv, adresa, radno vrijeme, opis i fotografije.",
      tips: [
        "Dodajte kvalitetne fotografije salona",
        "Napišite detaljan opis usluga koje nudite",
        "Unesite tačnu adresu za lakše pronalaženje"
      ]
    },
    {
      icon: CogIcon,
      title: "3. Postavite usluge i cijene",
      description: "Definirajte sve usluge koje vaš salon nudi, zajedno sa cijenama i trajanjem svakog tretmana. Možete organizovati usluge po kategorijama.",
      tips: [
        "Grupišite usluge po kategorijama (šišanje, farbanje, itd.)",
        "Unesite realne cijene i trajanje usluga",
        "Dodajte opis za svaku uslugu"
      ]
    },
    {
      icon: UsersIcon,
      title: "4. Dodajte osoblje",
      description: "Dodajte frizere i kozmetičare koji rade u vašem salonu. Svaki član osoblja može imati svoj raspored i specijalizacije.",
      tips: [
        "Dodajte profilne slike osoblja",
        "Navedite specijalizacije svakog radnika",
        "Postavite individualno radno vrijeme"
      ]
    },
    {
      icon: CalendarDaysIcon,
      title: "5. Postavite radno vrijeme",
      description: "Definirajte radno vrijeme salona za svaki dan u sedmici. Možete takođe označiti dane kada je salon zatvoren.",
      tips: [
        "Uzmite u obzir pauze u toku dana",
        "Označite praznike i neradne dane",
        "Postavite različito vrijeme za vikend"
      ]
    },
    {
      icon: CheckCircleIcon,
      title: "6. Spremni ste!",
      description: "Vaš salon je sada vidljiv korisnicima. Klijenti mogu pregledati vaš salon, vidjeti usluge i zakazivati termine online.",
      tips: [
        "Redovno ažurirajte informacije",
        "Odgovarajte na recenzije klijenata",
        "Pratite statistike i rezervacije"
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Kako registrovati salon? | Frizerino</title>
        <meta name="description" content="Vodič za registraciju frizerskog ili kozmetičkog salona na Frizerino platformi. Saznajte kako dodati salon u nekoliko jednostavnih koraka." />
        <link rel="canonical" href="/pomoc/kako-registrovati-salon" />
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
              Kako registrovati salon?
            </h1>
            <p className="text-xl text-orange-100">
              Vodič korak po korak za dodavanje vašeg salona na Frizerino platformu
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Zašto registrovati salon na Frizerino?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-orange-600 mb-2">100%</div>
                <p className="text-gray-600">Besplatna registracija</p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                <p className="text-gray-600">Online rezervacije</p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-orange-600 mb-2">0 KM</div>
                <p className="text-gray-600">Bez provizije</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {step.description}
                      </p>
                      <div className="bg-orange-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-orange-800 mb-2">Savjeti:</p>
                        <ul className="space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-center gap-2 text-sm text-orange-700">
                              <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">
              Spremni za registraciju?
            </h2>
            <p className="text-orange-100 mb-6">
              Pridružite se stotinama salona koji već koriste Frizerino platformu
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
            >
              <UserPlusIcon className="w-5 h-5" />
              Registrujte salon
            </Link>
          </div>

          {/* Help */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Imate dodatnih pitanja?{' '}
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
