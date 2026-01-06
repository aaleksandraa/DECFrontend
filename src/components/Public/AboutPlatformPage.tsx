import { 
  Shield, 
  CheckCircle,
  MapPin,
  Star,
  Users
} from 'lucide-react';

export function AboutPlatformPage() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            O Frizerino platformi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Moderna platforma za online zakazivanje termina u frizerskim i kozmetičkim salonima
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Naša misija</h2>
            <p className="text-gray-600 mb-4">
              Frizerino je nastao sa ciljem da pojednostavi proces zakazivanja termina u salonima 
              i omogući vlasnicima salona da efikasnije upravljaju svojim poslovanjem.
            </p>
            <p className="text-gray-600 mb-4">
              Vjerujemo da tehnologija treba biti dostupna svima – od malih lokalnih salona 
              do velikih lanaca. Zato smo kreirali platformu koja je jednostavna za korištenje, 
              ali dovoljno moćna da zadovolji sve potrebe modernog salona.
            </p>
            <p className="text-gray-600 mb-4">
              Fokusirani smo na lokalno tržište Bosne i Hercegovine, razumijemo specifičnosti 
              našeg regiona i prilagođavamo rješenja potrebama naših korisnika.
            </p>
            <p className="text-gray-600 font-semibold">
              Frizerino je razvijen u Bosni i Hercegovini sa jasnim ciljem da pomogne lokalnim 
              salonima da rastu u digitalnom okruženju.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sigurnost i privatnost</h3>
                  <p className="text-gray-600">
                    Vaši podaci su zaštićeni najnovijim sigurnosnim standardima. 
                    Koristimo SSL enkripciju i poštujemo GDPR propise.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">GDPR usklađenost</h3>
                  <p className="text-gray-600">
                    Platforma je u potpunosti usklađena sa GDPR propisima. 
                    Korisnici imaju punu kontrolu nad svojim podacima.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-pink-50 p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Lokalni fokus</h3>
                  <p className="text-gray-600">
                    Prilagođeni smo specifičnostima BiH tržišta – od jezika i valute 
                    do načina poslovanja i potreba lokalnih salona.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Zašto nam vjerovati?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Provjerene recenzije</h3>
              <p className="text-gray-600">
                Samo klijenti koji su rezervisali termin mogu ostaviti recenziju
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sigurna plaćanja</h3>
              <p className="text-gray-600">
                Svi podaci su zaštićeni SSL enkripcijom
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Podrška 24/7</h3>
              <p className="text-gray-600">
                Tim podrške uvijek spreman da pomogne
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
