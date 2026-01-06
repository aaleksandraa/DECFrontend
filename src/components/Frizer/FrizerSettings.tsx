import { useState, useEffect, useRef } from 'react';
import { Save, User, Lock, Bell, Calendar, Eye, EyeOff, CheckCircle, Camera, Plus, X, Briefcase, Award, Globe, Star, Instagram, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, staffAPI } from '../../services/api';

export function FrizerSettings() {
  const { user, updateUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.staff_profile?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile form
  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    phone: string;
    city: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other' | '';
  }>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
  });

  // Staff profile form
  const [staffProfileData, setStaffProfileData] = useState<{
    bio: string;
    bio_long: string;
    title: string;
    years_experience: number | '';
    languages: string[];
    specialties: string[];
    education: Array<{ school: string; degree: string; year: string }>;
    achievements: Array<{ title: string; description: string; year: string }>;
    instagram: string;
    facebook: string;
    tiktok: string;
    accepts_bookings: boolean;
    booking_note: string;
    is_public: boolean;
  }>({
    bio: user?.staff_profile?.bio || '',
    bio_long: user?.staff_profile?.bio_long || '',
    title: user?.staff_profile?.title || '',
    years_experience: user?.staff_profile?.years_experience || '',
    languages: user?.staff_profile?.languages || [],
    specialties: user?.staff_profile?.specialties || [],
    education: user?.staff_profile?.education || [],
    achievements: user?.staff_profile?.achievements || [],
    instagram: user?.staff_profile?.instagram || '',
    facebook: user?.staff_profile?.facebook || '',
    tiktok: user?.staff_profile?.tiktok || '',
    accepts_bookings: user?.staff_profile?.accepts_bookings ?? true,
    booking_note: user?.staff_profile?.booking_note || '',
    is_public: user?.staff_profile?.is_public ?? true,
  });

  // Temporary inputs for adding items
  const [newLanguage, setNewLanguage] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  
  // Settings form
  const [autoConfirm, setAutoConfirm] = useState(user?.staff_profile?.auto_confirm || false);
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      // Sync profile data
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
      });
    }
    if (user?.staff_profile) {
      setAutoConfirm(user.staff_profile.auto_confirm || false);
      
      // Sync staff profile data
      setStaffProfileData({
        bio: user.staff_profile.bio || '',
        bio_long: user.staff_profile.bio_long || '',
        title: user.staff_profile.title || '',
        years_experience: user.staff_profile.years_experience || '',
        languages: user.staff_profile.languages || [],
        specialties: user.staff_profile.specialties || [],
        education: user.staff_profile.education || [],
        achievements: user.staff_profile.achievements || [],
        instagram: user.staff_profile.instagram || '',
        facebook: user.staff_profile.facebook || '',
        tiktok: user.staff_profile.tiktok || '',
        accepts_bookings: user.staff_profile.accepts_bookings ?? true,
        booking_note: user.staff_profile.booking_note || '',
        is_public: user.staff_profile.is_public ?? true,
      });
      
      // Sync avatar URL when user data changes - only update if there's a new value
      const newAvatarUrl = user.staff_profile.avatar_url;
      if (newAvatarUrl) {
        setAvatarUrl(newAvatarUrl);
      }
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Dozvoljeni su samo JPEG i PNG formati.' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Slika ne smije biti veća od 2MB.' });
      return;
    }

    if (!user?.staff_profile?.salon_id || !user?.staff_profile?.id) {
      setMessage({ type: 'error', text: 'Greška: Nedostaju podaci o profilu.' });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await staffAPI.uploadAvatar(
        user.staff_profile.salon_id,
        user.staff_profile.id,
        formData
      );
      
      // Set the avatar URL immediately from the response
      const newAvatarUrl = result.avatar_url;
      if (newAvatarUrl) {
        setAvatarUrl(newAvatarUrl);
      }
      
      // Refresh user data to update context
      await refreshUser();
      
      setMessage({ type: 'success', text: 'Profilna slika je uspješno ažurirana!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Greška prilikom uploada slike.' });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const dataToSend: Partial<{
        name: string;
        email: string;
        phone: string;
        city: string;
        date_of_birth: string;
        gender: 'male' | 'female' | 'other';
      }> = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        city: profileData.city,
        date_of_birth: profileData.date_of_birth,
      };
      
      // Only include gender if it's a valid value
      if (profileData.gender) {
        dataToSend.gender = profileData.gender as 'male' | 'female' | 'other';
      }
      
      const success = await updateUser(dataToSend);
      if (success) {
        setMessage({ type: 'success', text: 'Profil je uspješno ažuriran!' });
      } else {
        setMessage({ type: 'error', text: 'Greška prilikom ažuriranja profila.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Došlo je do greške.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoConfirmChange = async (value: boolean) => {
    setLoading(true);
    setMessage(null);
    
    try {
      await staffAPI.updateOwnSettings({ auto_confirm: value });
      setAutoConfirm(value);
      // Refresh user data to get updated staff_profile
      await refreshUser();
      setMessage({ type: 'success', text: value 
        ? 'Auto-potvrda je uključena! Novi termini će biti automatski potvrđeni.' 
        : 'Auto-potvrda je isključena. Morat ćete ručno potvrditi termine.' 
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Greška prilikom ažuriranja postavki.' });
      // Revert the UI state
      setAutoConfirm(!value);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      await staffAPI.updateOwnSettings(staffProfileData);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profesionalni profil je uspješno ažuriran!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Greška prilikom ažuriranja profila.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.password_confirmation) {
      setMessage({ type: 'error', text: 'Lozinke se ne podudaraju.' });
      return;
    }
    
    if (passwordData.password.length < 8) {
      setMessage({ type: 'error', text: 'Lozinka mora imati najmanje 8 karaktera.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      await authAPI.changePassword(passwordData.current_password, passwordData.password);
      setMessage({ type: 'success', text: 'Lozinka je uspješno promijenjena!' });
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Greška prilikom promjene lozinke.' });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for arrays
  const addLanguage = () => {
    if (newLanguage.trim() && !staffProfileData.languages.includes(newLanguage.trim())) {
      setStaffProfileData({
        ...staffProfileData,
        languages: [...staffProfileData.languages, newLanguage.trim()]
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setStaffProfileData({
      ...staffProfileData,
      languages: staffProfileData.languages.filter(l => l !== language)
    });
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !staffProfileData.specialties.includes(newSpecialty.trim())) {
      setStaffProfileData({
        ...staffProfileData,
        specialties: [...staffProfileData.specialties, newSpecialty.trim()]
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setStaffProfileData({
      ...staffProfileData,
      specialties: staffProfileData.specialties.filter(s => s !== specialty)
    });
  };

  const addEducation = () => {
    setStaffProfileData({
      ...staffProfileData,
      education: [...staffProfileData.education, { school: '', degree: '', year: '' }]
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...staffProfileData.education];
    updated[index] = { ...updated[index], [field]: value };
    setStaffProfileData({ ...staffProfileData, education: updated });
  };

  const removeEducation = (index: number) => {
    setStaffProfileData({
      ...staffProfileData,
      education: staffProfileData.education.filter((_, i) => i !== index)
    });
  };

  const addAchievement = () => {
    setStaffProfileData({
      ...staffProfileData,
      achievements: [...staffProfileData.achievements, { title: '', description: '', year: '' }]
    });
  };

  const updateAchievement = (index: number, field: string, value: string) => {
    const updated = [...staffProfileData.achievements];
    updated[index] = { ...updated[index], [field]: value };
    setStaffProfileData({ ...staffProfileData, achievements: updated });
  };

  const removeAchievement = (index: number) => {
    setStaffProfileData({
      ...staffProfileData,
      achievements: staffProfileData.achievements.filter((_, i) => i !== index)
    });
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'professional', label: 'Profesionalni profil', icon: User },
    { id: 'appointments', label: 'Termini', icon: Calendar },
    { id: 'security', label: 'Sigurnost', icon: Lock },
    { id: 'notifications', label: 'Obavještenja', icon: Bell },
  ];

  const handleViewPublicProfile = () => {
    if (user?.staff_profile?.slug) {
      // Open in new tab
      window.open(`/profil/${user.staff_profile.slug}`, '_blank');
    } else {
      setMessage({ 
        type: 'error', 
        text: 'Vaš profil još nema javni URL. Kontaktirajte administratora.' 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Podešavanja</h1>
        {user?.staff_profile?.slug && (
          <button
            onClick={handleViewPublicProfile}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Pogledaj moj javni profil
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
                {/* Avatar with upload */}
                <div className="relative">
                  <div 
                    onClick={handleAvatarClick}
                    className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all ${
                      uploadingAvatar ? 'opacity-50' : ''
                    }`}
                  >
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={user?.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Camera icon overlay */}
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-gray-600">{user?.staff_profile?.role || 'Frizer'}</p>
                  <p className="text-xs text-gray-400 mt-1">Klikni na sliku za promjenu</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ime i prezime</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+387 61 123 456"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grad</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Sarajevo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datum rođenja</label>
                  <input
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData({ ...profileData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pol</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as 'male' | 'female' | 'other' | '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Izaberite</option>
                    <option value="male">Muški</option>
                    <option value="female">Ženski</option>
                    <option value="other">Ostalo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Čuvanje...' : 'Sačuvaj promjene'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'professional' && (
            <form onSubmit={handleStaffProfileSubmit} className="space-y-8">
              {/* Basic Professional Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  Osnovne informacije
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profesionalni naslov</label>
                    <input
                      type="text"
                      value={staffProfileData.title}
                      onChange={(e) => setStaffProfileData({ ...staffProfileData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="npr. Master Stilista"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Godine iskustva</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={staffProfileData.years_experience}
                      onChange={(e) => setStaffProfileData({ ...staffProfileData, years_experience: e.target.value ? parseInt(e.target.value) : '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="npr. 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kratak opis (bio)</label>
                  <textarea
                    value={staffProfileData.bio}
                    onChange={(e) => setStaffProfileData({ ...staffProfileData, bio: e.target.value })}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Kratko opišite sebe i svoj rad (max 500 karaktera)"
                  />
                  <p className="text-xs text-gray-500 mt-1">{staffProfileData.bio.length}/500 karaktera</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detaljniji opis</label>
                  <textarea
                    value={staffProfileData.bio_long}
                    onChange={(e) => setStaffProfileData({ ...staffProfileData, bio_long: e.target.value })}
                    rows={6}
                    maxLength={2000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Detaljnije opišite svoje iskustvo, pristup radu, filozofiju... (max 2000 karaktera)"
                  />
                  <p className="text-xs text-gray-500 mt-1">{staffProfileData.bio_long.length}/2000 karaktera</p>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  Jezici
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Dodaj jezik (npr. Bosanski, Engleski)"
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {staffProfileData.languages.map((language, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                    >
                      {language}
                      <button
                        type="button"
                        onClick={() => removeLanguage(language)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  Specijalnosti
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Dodaj specijalnost (npr. Balayage, Ombre)"
                  />
                  <button
                    type="button"
                    onClick={addSpecialty}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {staffProfileData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="text-pink-600 hover:text-pink-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Obrazovanje i certifikati
                  </h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj
                  </button>
                </div>
                <div className="space-y-4">
                  {staffProfileData.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">Obrazovanje #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateEducation(index, 'school', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          placeholder="Škola/Institucija"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          placeholder="Diploma/Certifikat"
                        />
                      </div>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Godina (npr. 2020 ili 2018-2020)"
                      />
                    </div>
                  ))}
                  {staffProfileData.education.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">Nema dodanih obrazovanja. Kliknite "Dodaj" da dodate.</p>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Postignuća i nagrade
                  </h3>
                  <button
                    type="button"
                    onClick={addAchievement}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj
                  </button>
                </div>
                <div className="space-y-4">
                  {staffProfileData.achievements.map((achievement, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">Postignuće #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeAchievement(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={achievement.title}
                        onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Naslov (npr. Prvo mjesto na takmičenju)"
                      />
                      <textarea
                        value={achievement.description}
                        onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Opis postignuća"
                      />
                      <input
                        type="text"
                        value={achievement.year}
                        onChange={(e) => updateAchievement(index, 'year', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Godina"
                      />
                    </div>
                  ))}
                  {staffProfileData.achievements.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">Nema dodanih postignuća. Kliknite "Dodaj" da dodate.</p>
                  )}
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-purple-600" />
                  Društvene mreže
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <input
                      type="url"
                      value={staffProfileData.instagram}
                      onChange={(e) => setStaffProfileData({ ...staffProfileData, instagram: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                    <input
                      type="url"
                      value={staffProfileData.facebook}
                      onChange={(e) => setStaffProfileData({ ...staffProfileData, facebook: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                    <input
                      type="url"
                      value={staffProfileData.tiktok}
                      onChange={(e) => setStaffProfileData({ ...staffProfileData, tiktok: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                </div>
              </div>

              {/* Booking Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Podešavanja rezervacija
                </h3>
                
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Prihvatam rezervacije</span>
                    <span className="text-sm text-gray-600">Klijenti mogu da rezervišu termine kod mene</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffProfileData.accepts_bookings}
                    onChange={(e) => setStaffProfileData({ ...staffProfileData, accepts_bookings: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Napomena za rezervacije</label>
                  <textarea
                    value={staffProfileData.booking_note}
                    onChange={(e) => setStaffProfileData({ ...staffProfileData, booking_note: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Dodatne informacije za klijente (npr. 'Molim vas da dođete 5 minuta ranije')"
                  />
                </div>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Javni profil</span>
                    <span className="text-sm text-gray-600">Prikaži moj profil u javnim pretragama</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffProfileData.is_public}
                    onChange={(e) => setStaffProfileData({ ...staffProfileData, is_public: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Čuvanje...' : 'Sačuvaj profesionalni profil'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Podešavanja termina</h3>
              
              <div className="space-y-4">
                <div className={`p-6 rounded-xl border-2 transition-all ${
                  autoConfirm 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className={`w-6 h-6 ${autoConfirm ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="font-semibold text-gray-900 text-lg">Automatska potvrda termina</span>
                      </div>
                      <p className="text-gray-600 ml-9">
                        Kada je uključeno, svi termini koje klijenti zakazuju kod vas bit će automatski potvrđeni 
                        bez potrebe za ručnim odobravanjem.
                      </p>
                      <div className="mt-4 ml-9">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className={`w-2 h-2 rounded-full ${autoConfirm ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {autoConfirm 
                            ? 'Termini se automatski potvrđuju' 
                            : 'Termini zahtijevaju ručnu potvrdu'
                          }
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoConfirm}
                          onChange={(e) => handleAutoConfirmChange(e.target.checked)}
                          disabled={loading}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">i</span>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Napomena:</p>
                      <p>
                        Ako je automatska potvrda uključena na nivou salona, svi termini će biti automatski potvrđeni 
                        bez obzira na vaša individualna podešavanja.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Promjena lozinke</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trenutna lozinka</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nova lozinka</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Potvrdi novu lozinku</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.password_confirmation}
                    onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? 'Čuvanje...' : 'Promijeni lozinku'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Podešavanja obavještenja</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Email obavještenja</span>
                    <span className="text-sm text-gray-600">Primaj obavještenja putem emaila</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Novi termini</span>
                    <span className="text-sm text-gray-600">Obavijesti me kada klijent zakaže termin</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Otkazivanja</span>
                    <span className="text-sm text-gray-600">Obavijesti me kada klijent otkaže termin</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="font-medium text-gray-900 block">Podsjetnici</span>
                    <span className="text-sm text-gray-600">Primaj podsjetnike za sutrašnje termine</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
