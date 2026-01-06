import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Politika privatnosti | Frizerino</title>
        <meta name="description" content="Politika privatnosti Frizerino platforme. Saznajte kako prikupljamo, koristimo i štitimo vaše podatke." />
        <link rel="canonical" href="/politika-privatnosti" />
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
              Politika privatnosti
            </h1>
            <p className="text-xl text-orange-100">
              Posljednje ažuriranje: 5. decembar 2025.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Uvod</h2>
                <p className="text-gray-600 leading-relaxed">
                  Dobrodošli na Frizerino.com. Vaša privatnost nam je izuzetno važna. Ova politika privatnosti 
                  objašnjava koje podatke prikupljamo, kako ih koristimo i koje mjere poduzimamo da bismo 
                  zaštitili vaše informacije.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Korištenjem naše platforme, pristajete na prikupljanje i korištenje informacija u skladu 
                  sa ovom politikom.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Podaci koje prikupljamo</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Podaci koje nam direktno dajete</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Ime i prezime</li>
                  <li>Email adresa</li>
                  <li>Broj telefona</li>
                  <li>Podaci o rezervacijama (datum, vrijeme, usluge)</li>
                  <li>Recenzije i komentari</li>
                  <li>Fotografije (za salone)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Automatski prikupljeni podaci</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>IP adresa</li>
                  <li>Tip pretraživača i uređaja</li>
                  <li>Stranice koje posjetite na našoj platformi</li>
                  <li>Vrijeme i datum posjeta</li>
                  <li>Lokacija (ako dozvolite)</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Kako koristimo vaše podatke</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Vaše podatke koristimo za sljedeće svrhe:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Omogućavanje rezervacije termina u salonima</li>
                  <li>Slanje potvrda i podsjetnika za termine</li>
                  <li>Komunikaciju u vezi sa vašim nalogom</li>
                  <li>Poboljšanje naših usluga i korisničkog iskustva</li>
                  <li>Slanje obavještenja o novostima i promocijama (uz vašu saglasnost)</li>
                  <li>Sprečavanje prevara i zloupotreba</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Dijeljenje podataka</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Vaše podatke dijelimo samo u sljedećim situacijama:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li><strong>Sa salonima:</strong> Kada napravite rezervaciju, salon dobija vaše ime, broj telefona i email za potrebe termina</li>
                  <li><strong>Sa pružaocima usluga:</strong> Koristimo treće strane za hosting, email usluge i analitiku</li>
                  <li><strong>Zakonske obaveze:</strong> Kada smo zakonski obavezani podijeliti podatke</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  <strong>Ne prodajemo</strong> vaše lične podatke trećim stranama.
                </p>
              </section>

              <section className="mb-12 bg-blue-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4.1 Pristanak za kontakt komunikaciju</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Prilikom registracije, tražimo vaš pristanak da saloni i administratori platforme mogu 
                  koristiti vašu email adresu i broj telefona za sljedeće svrhe:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Potvrda i podsjetnici za zakazane termine</li>
                  <li>Komunikacija u slučaju promjene ili otkazivanja termina</li>
                  <li>Odgovaranje na vaše upite i pritužbe</li>
                  <li>Slanje obavještenja o važnim promjenama u salonu</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4 font-medium">
                  Ovaj pristanak je obavezan za korištenje platforme jer omogućava funkcionisanje sistema rezervacija.
                </p>
              </section>

              <section className="mb-12 bg-purple-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4.2 Javni prikaz podataka (za salone i frizere)</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Ako se registrujete kao salon ili frizer, tražimo vaš pristanak za javno prikazivanje 
                  sljedećih podataka na platformi:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Naziv salona i opis djelatnosti</li>
                  <li>Adresa i lokacija na mapi</li>
                  <li>Kontakt podaci (telefon, email)</li>
                  <li>Radno vrijeme</li>
                  <li>Fotografije salona i radova</li>
                  <li>Cjenovnik usluga</li>
                  <li>Imena i fotografije zaposlenih (frizera)</li>
                  <li>Recenzije i ocjene klijenata</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4 font-medium">
                  Ovaj pristanak je obavezan za salone i frizere jer je svrha platforme upravo javni prikaz 
                  i promocija vaših usluga.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sigurnost podataka</h2>
                <p className="text-gray-600 leading-relaxed">
                  Primjenjujemo tehničke i organizacijske mjere za zaštitu vaših podataka, uključujući:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                  <li>SSL enkripciju za sve komunikacije</li>
                  <li>Sigurno čuvanje lozinki (hashiranje)</li>
                  <li>Ograničen pristup podacima samo ovlaštenom osoblju</li>
                  <li>Redovne sigurnosne provjere</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Vaša prava</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Imate sljedeća prava u vezi sa vašim podacima:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li><strong>Pristup:</strong> Možete zatražiti kopiju svih podataka koje imamo o vama</li>
                  <li><strong>Ispravka:</strong> Možete ažurirati ili ispraviti netačne podatke</li>
                  <li><strong>Brisanje:</strong> Možete zatražiti brisanje vašeg naloga i podataka</li>
                  <li><strong>Prigovor:</strong> Možete se usprotiviti obradi podataka za marketing svrhe</li>
                  <li><strong>Prenosivost:</strong> Možete zatražiti prijenos podataka na drugu platformu</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Za ostvarivanje ovih prava, kontaktirajte nas na{' '}
                  <a href="mailto:privatnost@frizerino.com" className="text-orange-600 hover:underline">
                    privatnost@frizerino.com
                  </a>
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Kolačići (Cookies)</h2>
                <p className="text-gray-600 leading-relaxed">
                  Koristimo kolačiće za poboljšanje vašeg iskustva na platformi. Kolačići su male datoteke 
                  koje se pohranjuju na vašem uređaju. Koristimo ih za:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-4">
                  <li>Pamćenje vaše prijave</li>
                  <li>Analizu korištenja platforme</li>
                  <li>Personalizaciju sadržaja</li>
                </ul>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Možete kontrolirati kolačiće putem postavki vašeg pretraživača.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Zadržavanje podataka</h2>
                <p className="text-gray-600 leading-relaxed">
                  Vaše podatke čuvamo dok imate aktivan nalog na platformi. Nakon brisanja naloga, 
                  podaci se brišu u roku od 30 dana, osim ako zakonske obaveze ne zahtijevaju duže čuvanje.
                </p>
                <p className="text-gray-600 leading-relaxed mt-4">
                  Podaci o rezervacijama se čuvaju radi historije i mogućih reklamacija.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Djeca</h2>
                <p className="text-gray-600 leading-relaxed">
                  Naša platforma nije namijenjena osobama mlađim od 16 godina. Ne prikupljamo svjesno 
                  podatke od djece. Ako saznamo da smo prikupili podatke od djeteta, odmah ćemo ih izbrisati.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Promjene politike</h2>
                <p className="text-gray-600 leading-relaxed">
                  Zadržavamo pravo izmjene ove politike privatnosti. O značajnim promjenama ćemo vas 
                  obavijestiti putem emaila ili obavještenja na platformi. Preporučujemo redovno 
                  pregledavanje ove stranice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Kontakt</h2>
                <p className="text-gray-600 leading-relaxed">
                  Za sva pitanja u vezi sa privatnošću, kontaktirajte nas:
                </p>
                <div className="bg-gray-50 rounded-xl p-6 mt-4">
                  <p className="text-gray-700">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:privatnost@frizerino.com" className="text-orange-600 hover:underline">
                      privatnost@frizerino.com
                    </a>
                  </p>
                  <p className="text-gray-700 mt-2">
                    <strong>Adresa:</strong> Ferhadija 15, 71000 Sarajevo, BiH
                  </p>
                </div>
              </section>

            </div>
          </div>

          {/* Help */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Imate pitanja?{' '}
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
