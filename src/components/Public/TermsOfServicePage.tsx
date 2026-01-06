import React from 'react';
import { Link } from 'react-router-dom';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Back link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Nazad na početnu
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Uslovi korištenja
          </h1>

          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6">
            <p className="text-gray-600 text-sm">
              Posljednje ažuriranje: {new Date().toLocaleDateString('bs-BA')}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Opći uslovi</h2>
              <p className="text-gray-700 leading-relaxed">
                Korištenjem platforme Frizerino (frizerino.com) prihvatate ove uslove korištenja. 
                Frizerino je platforma za online rezervaciju termina u frizerskim i kozmetičkim salonima 
                u Bosni i Hercegovini.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Registracija korisnika</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Za korištenje određenih funkcija platforme potrebno je kreirati korisnički račun. 
                Prilikom registracije obavezujete se da ćete:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Pružiti tačne i potpune informacije</li>
                <li>Održavati sigurnost svog računa i lozinke</li>
                <li>Obavijestiti nas o bilo kakvoj neovlaštenoj upotrebi vašeg računa</li>
                <li>Preuzeti odgovornost za sve aktivnosti na vašem računu</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Rezervacija termina</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Prilikom rezervacije termina putem Frizerino platforme:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Obavezujete se da ćete se pojaviti na zakazani termin ili otkazati najmanje 2 sata prije</li>
                <li>Nepojavljivanje bez otkazivanja može rezultirati ograničenjem korištenja platforme</li>
                <li>Salon zadržava pravo odbiti pružanje usluge u slučaju kršenja pravila</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Obaveze salona</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Saloni registrovani na platformi obavezuju se da će:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Pružiti tačne informacije o uslugama i cijenama</li>
                <li>Održavati ažurirano radno vrijeme</li>
                <li>Poštovati rezervacije klijenata</li>
                <li>Pružiti kvalitetnu uslugu u skladu sa opisom</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Recenzije i ocjene</h2>
              <p className="text-gray-700 leading-relaxed">
                Korisnici mogu ostavljati recenzije samo za usluge koje su koristili. 
                Recenzije moraju biti istinite i objektivne. Zabranjeno je ostavljanje lažnih recenzija, 
                uvredljivih komentara ili neprimjerenog sadržaja. Frizerino zadržava pravo ukloniti 
                recenzije koje krše ova pravila.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intelektualno vlasništvo</h2>
              <p className="text-gray-700 leading-relaxed">
                Sav sadržaj na platformi Frizerino, uključujući logo, dizajn, tekst i softver, 
                vlasništvo je Frizerino tima ili njegovih partnera i zaštićen je zakonima o 
                intelektualnom vlasništvu.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Ograničenje odgovornosti</h2>
              <p className="text-gray-700 leading-relaxed">
                Frizerino ne preuzima odgovornost za kvalitet usluga pruženih od strane salona. 
                Platforma služi kao posrednik za rezervacije i ne garantuje rezultate usluga. 
                Svi sporovi između klijenata i salona rješavaju se direktno između tih strana.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Promjene uslova</h2>
              <p className="text-gray-700 leading-relaxed">
                Frizerino zadržava pravo izmjene ovih uslova korištenja. O značajnim promjenama 
                ćemo vas obavijestiti putem email-a ili obavještenja na platformi. Nastavak korištenja 
                platforme nakon promjena smatra se prihvatanjem novih uslova.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Kontakt</h2>
              <p className="text-gray-700 leading-relaxed">
                Za sva pitanja u vezi sa uslovima korištenja, možete nas kontaktirati na:
              </p>
              <p className="text-gray-700 mt-2">
                Email: <a href="mailto:info@frizerino.com" className="text-orange-600 hover:text-orange-700">info@frizerino.com</a>
              </p>
              <p className="text-gray-700">
                Web: <a href="https://frizerino.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700">www.frizerino.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default TermsOfServicePage;
