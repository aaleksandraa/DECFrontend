import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Lock,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { jobAdsAPI, locationsAPI } from '../../services/api';

// Helper functions for European date format
const formatDateToEuropean = (isoDate: string): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseEuropeanDate = (euroDate: string): string => {
  if (!euroDate) return '';
  const parts = euroDate.split('.');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

interface JobAd {
  id: number;
  company_name: string;
  position_title: string;
  description: string;
  gender_requirement: 'male' | 'female' | 'any';
  contact_email: string;
  contact_phone?: string;
  city?: string;
  deadline?: string;
  is_active: boolean;
  created_at: string;
}

interface SalonInfo {
  id: number;
  name: string;
  city: string;
  email: string;
  phone: string;
}

interface JobAdFormData {
  position_title: string;
  description: string;
  gender_requirement: 'male' | 'female' | 'any';
  contact_email: string;
  contact_phone: string;
  city: string;
  deadline: string;
}

export function SalonJobAds() {
  const [jobAds, setJobAds] = useState<JobAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowPosting, setAllowPosting] = useState(false);
  const [salon, setSalon] = useState<SalonInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<JobAd | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<JobAdFormData>({
    position_title: '',
    description: '',
    gender_requirement: 'any',
    contact_email: '',
    contact_phone: '',
    city: '',
    deadline: ''
  });

  // Cities autocomplete state
  const [cities, setCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await locationsAPI.getAll();
        const cityNames = [...new Set((response.locations || []).map((loc: any) => loc.name))].sort() as string[];
        setCities(cityNames);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    setFormData({ ...formData, city });
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  // Date display state (European format dd.mm.yyyy)
  const [deadlineDisplay, setDeadlineDisplay] = useState('');

  useEffect(() => {
    loadJobAds();
  }, []);

  const loadJobAds = async () => {
    try {
      setLoading(true);
      const response = await jobAdsAPI.ownerGetAll();
      setJobAds(response.job_ads || []);
      setAllowPosting(response.allow_posting || false);
      setSalon(response.salon || null);
    } catch (error) {
      console.error('Error loading job ads:', error);
      setMessage({ type: 'error', text: 'Greška pri učitavanju oglasa.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!salon) return;
    
    setEditingAd(null);
    setFormData({
      position_title: '',
      description: '',
      gender_requirement: 'any',
      contact_email: salon.email || '',
      contact_phone: salon.phone || '',
      city: salon.city || '',
      deadline: ''
    });
    setCitySearch(salon.city || '');
    setDeadlineDisplay('');
    setShowModal(true);
  };

  const handleEdit = (ad: JobAd) => {
    setEditingAd(ad);
    setFormData({
      position_title: ad.position_title,
      description: ad.description,
      gender_requirement: ad.gender_requirement,
      contact_email: ad.contact_email,
      contact_phone: ad.contact_phone || '',
      city: ad.city || '',
      deadline: ad.deadline ? ad.deadline.split('T')[0] : ''
    });
    setCitySearch(ad.city || '');
    setDeadlineDisplay(ad.deadline ? formatDateToEuropean(ad.deadline) : '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingAd) {
        await jobAdsAPI.ownerUpdate(editingAd.id, formData);
        setMessage({ type: 'success', text: 'Oglas je uspješno ažuriran.' });
      } else {
        await jobAdsAPI.ownerCreate(formData);
        setMessage({ type: 'success', text: 'Oglas je uspješno kreiran.' });
      }
      setShowModal(false);
      loadJobAds();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Greška pri čuvanju oglasa.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Da li ste sigurni da želite obrisati ovaj oglas?')) return;
    
    try {
      await jobAdsAPI.ownerDelete(id);
      setMessage({ type: 'success', text: 'Oglas je uspješno obrisan.' });
      loadJobAds();
    } catch (error) {
      setMessage({ type: 'error', text: 'Greška pri brisanju oglasa.' });
    }
  };

  const handleToggleActive = async (ad: JobAd) => {
    try {
      await jobAdsAPI.ownerUpdate(ad.id, { is_active: !ad.is_active });
      loadJobAds();
    } catch (error) {
      setMessage({ type: 'error', text: 'Greška pri promjeni statusa oglasa.' });
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Muškarac';
      case 'female': return 'Žena';
      case 'any': return 'M/Ž';
      default: return 'M/Ž';
    }
  };

  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-700';
      case 'female': return 'bg-pink-100 text-pink-700';
      case 'any': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}.`;
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If owner posting is not allowed
  if (!allowPosting) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oglasi za posao</h1>
          <p className="text-gray-600">Objavite oglas za zapošljavanje u vašem salonu</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Objavljivanje oglasa nije omogućeno
          </h3>
          <p className="text-yellow-700">
            Administrator platforme trenutno nije omogućio vlasnicima salona da objavljuju oglase za posao.
            Kontaktirajte podršku za više informacija.
          </p>
        </div>
      </div>
    );
  }

  const stats = {
    total: jobAds.length,
    active: jobAds.filter(a => a.is_active && !isDeadlinePassed(a.deadline)).length,
    expired: jobAds.filter(a => isDeadlinePassed(a.deadline)).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oglasi za posao</h1>
          <p className="text-gray-600">Objavite oglas za zapošljavanje u vašem salonu</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novi oglas
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Ukupno</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-500">Aktivni</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.expired}</p>
              <p className="text-sm text-gray-500">Istekli</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Ads List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {jobAds.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Nemate nijedan oglas za posao</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Kreiraj prvi oglas
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {jobAds.map((ad) => (
              <div key={ad.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{ad.position_title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGenderBadgeColor(ad.gender_requirement)}`}>
                        {getGenderLabel(ad.gender_requirement)}
                      </span>
                      {ad.is_active && !isDeadlinePassed(ad.deadline) ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Aktivan
                        </span>
                      ) : isDeadlinePassed(ad.deadline) ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Istekao
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Neaktivan
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ad.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {ad.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {ad.city}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {ad.contact_email}
                      </span>
                      {ad.contact_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {ad.contact_phone}
                        </span>
                      )}
                      {ad.deadline && (
                        <span className={`flex items-center gap-1 ${isDeadlinePassed(ad.deadline) ? 'text-red-500' : ''}`}>
                          <Calendar className="w-4 h-4" />
                          Rok: {formatDate(ad.deadline)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Objavljeno: {formatDate(ad.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`p-2 rounded-lg transition-colors ${
                        ad.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={ad.is_active ? 'Deaktiviraj' : 'Aktiviraj'}
                    >
                      {ad.is_active ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(ad)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Uredi"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Obriši"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAd ? 'Uredi oglas' : 'Novi oglas za posao'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Oglas će biti objavljen pod imenom: <strong>{salon?.name}</strong>
              </p>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pozicija *
                </label>
                <input
                  type="text"
                  value={formData.position_title}
                  onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="npr. Frizer, Kozmetičar, Pripravnik"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis oglasa *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Opišite radnu poziciju, uslove, beneficije..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Traženi spol
                  </label>
                  <select
                    value={formData.gender_requirement}
                    onChange={(e) => setFormData({ ...formData, gender_requirement: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="any">Bilo koji (M/Ž)</option>
                    <option value="male">Muškarac</option>
                    <option value="female">Žena</option>
                  </select>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grad
                  </label>
                  <div className="relative">
                    <input
                      ref={cityInputRef}
                      type="text"
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setFormData({ ...formData, city: e.target.value });
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ukucajte grad..."
                    />
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div
                      ref={cityDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {filteredCities.slice(0, 10).map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-3 py-2 text-left hover:bg-pink-50 text-sm"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rok prijave
                  </label>
                  <div className="relative">
                    {/* Hidden date input for calendar picker */}
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, deadline: value });
                        // Update display format
                        if (value) {
                          setDeadlineDisplay(formatDateToEuropean(value));
                        } else {
                          setDeadlineDisplay('');
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {/* Visible European format display */}
                    <input
                      type="text"
                      value={deadlineDisplay}
                      readOnly
                      placeholder="dd.mm.yyyy"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white cursor-pointer"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Kliknite za odabir datuma</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontakt email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder={salon?.email || 'email@salon.com'}
                  />
                  <p className="text-xs text-gray-400 mt-1">Ostavite prazno za email salona</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontakt telefon
                  </label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder={salon?.phone || '+387 61 123 456'}
                  />
                  <p className="text-xs text-gray-400 mt-1">Ostavite prazno za telefon salona</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Čuvanje...' : (editingAd ? 'Sačuvaj promjene' : 'Objavi oglas')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalonJobAds;
