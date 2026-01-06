import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  TrendingUp,
  Layout,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export function ForSalonsPage() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kompletan operativni sistem za moderno vođenje salona
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Frizerino nije samo platforma za zakazivanje termina. To je alat koji transformiše način rada vašeg salona.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Online rezervacije 24/7
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Klijenti rezervišu termine bilo kada</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Automatsko potvrđivanje termina</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Smanjenje telefonskih poziva</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Podsjetnici za klijente</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Upravljanje rasporedima
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Kalendar za sve zaposlene</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Radno vrijeme i pauze</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Upravljanje uslugama i cijenama</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Baza klijenata i istorija</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Analitika i izvještaji
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Praćenje prihoda i statistike</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Najpopularnije usluge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Performanse zaposlenih</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Izvještaji po periodu</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Widget Feature */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full mb-4">
                <Layout className="w-5 h-5" />
                <span className="font-semibold">Booking Widget</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Dodajte rezervacije na vaš website
              </h2>
              <p className="text-lg text-purple-100 mb-6">
                Integrirajte Frizerino booking widget na vašu web stranicu. 
                Klijenti mogu rezervisati termine direktno sa vašeg sajta.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Jednostavna integracija</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Prilagodljiv dizajn</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>Sinhronizacija u realnom vremenu</span>
                </li>
              </ul>
              <p className="text-sm text-purple-100">
                Widget se automatski sinhronizuje sa Frizerino sistemom i ne zahtijeva tehničko znanje.
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="bg-white rounded-lg p-4 text-gray-900">
                <code className="text-sm">
                  {'<script src="frizerino.com/widget.js"></script>'}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/registracija"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Registrujte salon besplatno
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-600 mt-4">Bez ugovora, bez skrivenih troškova</p>
        </div>
      </div>
    </section>
  );
}
