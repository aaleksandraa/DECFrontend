import { Link } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Star, 
  Bell, 
  CheckCircle,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

export function ForClientsPage() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Online zakazivanje frizera – brzo i jednostavno
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Rezervacija termina frizer nikada nije bila lakša. Pronađite frizerski salon u blizini, vidite dostupne termine i rezervišite online.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Kako pronaći salon
                </h2>
                <p className="text-gray-600">
                  Unesite grad ili koristite svoju lokaciju. Filtrirajte po tipu salona, uslugama i ocjenama. 
                  Vidite frizerski saloni u Sarajevu, Banja Luci, Mostaru i drugim gradovima.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Kako rezervisati termin
                </h2>
                <p className="text-gray-600">
                  Odaberite salon, vidite dostupne termine u realnom vremenu, izaberite uslugu i frizera. 
                  Rezervacija termina frizer traje samo 30 sekundi – bez poziva i čekanja.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-pink-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Recenzije stvarnih klijenata
                </h2>
                <p className="text-gray-600">
                  Samo klijenti koji su rezervisali i posjetili salon mogu ostaviti recenziju. 
                  Pročitajte iskustva drugih i pronađite najbolji kozmetički salon online rezervacija.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Podsjetnici i notifikacije
                </h2>
                <p className="text-gray-600">
                  Automatski podsjetnici dan prije termina. Pratite status rezervacije i primajte obavještenja o promocijama.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Spremni za rezervaciju?
              </h3>
              <p className="text-gray-600 mb-6">
                Pronađite frizer u blizini i rezervišite termin za nekoliko klikova
              </p>
              <Link
                to="/pretraga"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Pronađi slobodan termin
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Često postavljana pitanja
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kako funkcioniše online zakazivanje frizera?
              </h3>
              <p className="text-gray-600">
                Pretražite salone u vašem gradu, odaberite željeni salon i vidite dostupne termine u realnom vremenu. 
                Kliknite na slobodan termin, izaberite uslugu i potvrdite rezervaciju. Dobićete potvrdu na email i SMS podsjetnik.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Da li je rezervacija termina besplatna?
              </h3>
              <p className="text-gray-600">
                Da, rezervacija termina preko Frizerino platforme je potpuno besplatna za klijente. 
                Plaćate samo uslugu u salonu nakon tretmana.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Kako pronaći frizera u blizini?
              </h3>
              <p className="text-gray-600">
                Koristite našu pretragu sa opcijom "Blizina" ili omogućite pristup lokaciji u browseru. 
                Sistem će automatski prikazati salone sortirane po udaljenosti od vaše trenutne lokacije.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Da li mogu otkazati termin?
              </h3>
              <p className="text-gray-600">
                Da, možete otkazati termin do 24 sata prije zakazanog vremena. 
                Prijavite se na svoj nalog, idite na "Moji termini" i kliknite "Otkaži termin". 
                Dobićete potvrdu o otkazivanju.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
