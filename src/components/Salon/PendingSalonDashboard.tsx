import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Edit,
  Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { salonAPI } from '../../services/api';
import { SalonProfile } from './SalonProfile';

export function PendingSalonDashboard() {
  const { user } = useAuth();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    loadSalonData();
  }, [user]);

  const loadSalonData = async () => {
    if (!user?.salon?.id) {
      setLoading(false);
      return;
    }

    try {
      const salonData = await salonAPI.getSalon(user.salon.id);
      setSalon(salonData);
    } catch (error) {
      console.error('Error loading salon:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (showProfile) {
    return <SalonProfile />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Banner */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Vaš salon čeka odobrenje
            </h2>
            <p className="text-yellow-700 mb-4">
              Vaš salon je uspješno kreiran i poslan na pregled administratoru. 
              Kada bude odobren, dobićete email obavijest i moći ćete:
            </p>
            <ul className="space-y-2 text-yellow-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-yellow-600" />
                Dodavati usluge i cjenovnik
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-yellow-600" />
                Dodavati zaposlene
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-yellow-600" />
                Primati rezervacije od klijenata
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-yellow-600" />
                Vidjeti analitiku i statistike
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Salon Preview Card */}
      {salon && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pregled vašeg salona</h3>
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Uredi profil
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Salon Image */}
              <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {salon.images && salon.images.length > 0 ? (
                  <img 
                    src={salon.images[0].url} 
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="text-sm">Nema fotografija</span>
                  </div>
                )}
              </div>
              
              {/* Salon Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{salon.name}</h4>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full mt-2">
                    <Clock className="w-3 h-3" />
                    Na čekanju
                  </span>
                </div>
                
                <p className="text-gray-600 line-clamp-3">
                  {salon.description || 'Nema opisa'}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {salon.address}, {salon.city}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {salon.phone || 'Nije uneseno'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {salon.email || 'Nije uneseno'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What to do while waiting */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Dok čekate odobrenje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Edit className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Uredite profil</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Dodajte više detalja, fotografije i poboljšajte opis salona.
                </p>
                <button
                  onClick={() => setShowProfile(true)}
                  className="text-blue-600 text-sm font-medium mt-2 hover:underline"
                >
                  Uredi profil →
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Dodajte fotografije</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Kvalitetne fotografije privlače više klijenata.
                </p>
                <button
                  onClick={() => setShowProfile(true)}
                  className="text-green-600 text-sm font-medium mt-2 hover:underline"
                >
                  Dodaj fotografije →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">
          Imate pitanja? Kontaktirajte nas na{' '}
          <a href="mailto:podrska@frizerino.com" className="text-blue-600 hover:underline">
            podrska@frizerino.com
          </a>
        </p>
      </div>
    </div>
  );
}
