import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, User, Save, X, GripVertical, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { staffAPI, serviceAPI } from '../../services/api';
import { StaffRole, StaffRoleLabels } from '../../types';

export function SalonStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggedStaff, setDraggedStaff] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    email: '',
    phone: '',
    password: '',
    specialties: [] as string[],
    working_hours: {
      monday: { start: '09:00', end: '17:00', is_working: true },
      tuesday: { start: '09:00', end: '17:00', is_working: true },
      wednesday: { start: '09:00', end: '17:00', is_working: true },
      thursday: { start: '09:00', end: '17:00', is_working: true },
      friday: { start: '09:00', end: '17:00', is_working: true },
      saturday: { start: '09:00', end: '15:00', is_working: true },
      sunday: { start: '10:00', end: '14:00', is_working: false }
    },
    service_ids: [] as string[]
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.salon) return;
    
    try {
      setLoading(true);
      const [staffData, servicesData] = await Promise.all([
        staffAPI.getStaff(user.salon.id),
        serviceAPI.getServices(user.salon.id)
      ]);
      
      // Handle paginated or array response
      const staffArray = Array.isArray(staffData) ? staffData : (staffData?.data || []);
      // Sort by display_order
      staffArray.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      
      setStaff(staffArray);
      setServices(Array.isArray(servicesData) ? servicesData : (servicesData?.data || []));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      bio: '',
      email: '',
      phone: '',
      password: '',
      specialties: [],
      working_hours: {
        monday: { start: '09:00', end: '17:00', is_working: true },
        tuesday: { start: '09:00', end: '17:00', is_working: true },
        wednesday: { start: '09:00', end: '17:00', is_working: true },
        thursday: { start: '09:00', end: '17:00', is_working: true },
        friday: { start: '09:00', end: '17:00', is_working: true },
        saturday: { start: '09:00', end: '15:00', is_working: true },
        sunday: { start: '10:00', end: '14:00', is_working: false }
      },
      service_ids: []
    });
    setNewSpecialty('');
    setErrors({});
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      role: staffMember.role,
      bio: staffMember.bio || '',
      email: staffMember.user?.email || '',
      phone: staffMember.user?.phone || '',
      password: '',
      specialties: [...(staffMember.specialties || [])],
      working_hours: { ...staffMember.working_hours },
      service_ids: staffMember.services?.map((s: any) => s.id) || []
    });
    setShowAddModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Ime i prezime je obavezno';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Ime mora imati najmanje 3 karaktera';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Tip zaposlenog je obavezan';
    }

    // Email validation
    if (!editingStaff) {
      // For new staff, email is required
      if (!formData.email.trim()) {
        newErrors.email = 'Email je obavezan';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email adresa nije validna';
      }
    } else {
      // For editing, email is optional but must be valid if provided
      if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email adresa nije validna';
      }
    }

    // Password validation
    if (!editingStaff) {
      // For new staff, password is required
      if (!formData.password) {
        newErrors.password = 'Lozinka je obavezna';
      } else {
        if (formData.password.length < 8) {
          newErrors.password = 'Lozinka mora imati najmanje 8 karaktera';
        } else if (!/[A-Z]/.test(formData.password)) {
          newErrors.password = 'Lozinka mora sadržavati najmanje jedno veliko slovo';
        } else if (!/[a-z]/.test(formData.password)) {
          newErrors.password = 'Lozinka mora sadržavati najmanje jedno malo slovo';
        } else if (!/[0-9]/.test(formData.password)) {
          newErrors.password = 'Lozinka mora sadržavati najmanje jedan broj';
        }
      }
    } else {
      // For editing, password is optional but must be valid if provided
      if (formData.password && formData.password.trim()) {
        if (formData.password.length < 8) {
          newErrors.password = 'Lozinka mora imati najmanje 8 karaktera';
        } else if (!/[A-Z]/.test(formData.password)) {
          newErrors.password = 'Lozinka mora sadržavati najmanje jedno veliko slovo';
        } else if (!/[a-z]/.test(formData.password)) {
          newErrors.password = 'Lozinka mora sadržavati najmanje jedno malo slovo';
        } else if (!/[0-9]/.test(formData.password)) {
          newErrors.password = 'Lozinka mora sadržavati najmanje jedan broj';
        }
      }
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Broj telefona nije validan';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user?.salon) return;

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      if (editingStaff) {
        // Update existing staff
        const response = await staffAPI.updateStaff(user.salon.id, editingStaff.id, formData);
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? response.staff : s));
      } else {
        // Create new staff
        const response = await staffAPI.createStaff(user.salon.id, formData);
        setStaff(prev => [...prev, response.staff]);
      }
      
      setShowAddModal(false);
      setEditingStaff(null);
      resetForm();
      setErrors({});
    } catch (error: any) {
      console.error('Error saving staff:', error);
      
      // Handle server validation errors
      if (error.response?.data?.errors) {
        const serverErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach(key => {
          const errorArray = error.response.data.errors[key];
          serverErrors[key] = Array.isArray(errorArray) ? errorArray[0] : errorArray;
        });
        setErrors(serverErrors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Greška prilikom čuvanja zaposlenog' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!window.confirm('Da li ste sigurni da želite da uklonite ovog zaposlenog?')) return;
    if (!user?.salon) return;
    
    try {
      await staffAPI.deleteStaff(user.salon.id, staffId);
      setStaff(prev => prev.filter(s => s.id !== staffId));
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  const handleWorkingHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [day]: {
          ...(prev.working_hours as any)[day],
          [field]: value
        }
      }
    }));
  };

  // Drag handlers for staff
  const handleStaffDragStart = (e: React.DragEvent, staffMember: any) => {
    setDraggedStaff(staffMember);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStaffDragOver = (e: React.DragEvent, targetStaff: any) => {
    e.preventDefault();
    if (!draggedStaff || draggedStaff.id === targetStaff.id) return;
    
    const newStaff = [...staff];
    const draggedIndex = newStaff.findIndex(s => s.id === draggedStaff.id);
    const targetIndex = newStaff.findIndex(s => s.id === targetStaff.id);
    
    newStaff.splice(draggedIndex, 1);
    newStaff.splice(targetIndex, 0, draggedStaff);
    
    // Update display_order
    newStaff.forEach((s, i) => s.display_order = i);
    
    setStaff(newStaff);
    setHasOrderChanges(true);
  };

  const handleStaffDragEnd = () => {
    setDraggedStaff(null);
  };

  // Save order changes
  const saveOrderChanges = async () => {
    if (!user?.salon) return;
    
    try {
      setSavingOrder(true);
      await staffAPI.reorderStaff(user.salon.id, {
        staff: staff.map((s, i) => ({ id: s.id, display_order: i }))
      });
      setHasOrderChanges(false);
      setIsReordering(false);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Greška pri spremanju redoslijeda');
    } finally {
      setSavingOrder(false);
    }
  };

  const WorkingHoursDisplay = ({ workingHours }: { workingHours: any }) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
    
    return (
      <div className="text-sm text-gray-600">
        {days.map((day, index) => {
          const schedule = workingHours[day];
          return (
            <div key={day} className="flex justify-between">
              <span>{dayNames[index]}:</span>
              <span>
                {schedule?.is_working ? `${schedule.start}-${schedule.end}` : 'Ne radi'}
              </span>
            </div>
          );
        })}
      </div>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Upravljanje zaposlenima</h1>
        <div className="flex gap-2 flex-wrap">
          {isReordering ? (
            <>
              <button 
                onClick={() => {
                  setIsReordering(false);
                  setHasOrderChanges(false);
                  loadData();
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Otkaži
              </button>
              <button 
                onClick={saveOrderChanges}
                disabled={!hasOrderChanges || savingOrder}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {savingOrder ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Sačuvaj redoslijed
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsReordering(true)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <GripVertical className="w-4 h-4" />
                Promijeni redoslijed
              </button>
              <button 
                onClick={() => {
                  resetForm();
                  setEditingStaff(null);
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Dodaj zaposlenog
              </button>
            </>
          )}
        </div>
      </div>
      
      {isReordering && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Način uređivanja:</strong> Povucite kartice zaposlenih da promijenite njihov redoslijed. 
            Ovaj redoslijed će se prikazivati na profilu salona i widgetu.
          </p>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(staffMember => (
          <div 
            key={staffMember.id} 
            className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 ${isReordering ? 'cursor-move' : ''} ${draggedStaff?.id === staffMember.id ? 'opacity-50 ring-2 ring-blue-400' : ''}`}
            draggable={isReordering}
            onDragStart={(e) => isReordering && handleStaffDragStart(e, staffMember)}
            onDragOver={(e) => isReordering && handleStaffDragOver(e, staffMember)}
            onDragEnd={handleStaffDragEnd}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {isReordering && (
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {staffMember.avatar ? (
                    <img 
                      src={staffMember.avatar} 
                      alt={staffMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{staffMember.name}</h3>
                  <p className="text-sm text-gray-600">{StaffRoleLabels[staffMember.role as StaffRole] || staffMember.role}</p>
                  {staffMember.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{staffMember.rating}</span>
                      <span className="text-xs text-gray-500">({staffMember.review_count})</span>
                    </div>
                  )}
                </div>
              </div>

              {staffMember.bio && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{staffMember.bio}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Specijalnosti</h4>
                  <div className="flex flex-wrap gap-1">
                    {staffMember.specialties?.map((specialty: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Radno vreme</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <WorkingHoursDisplay workingHours={staffMember.working_hours} />
                  </div>
                </div>
              </div>

              {!isReordering && (
                <div className="flex gap-2 mt-6">
                  <button 
                    onClick={() => handleEdit(staffMember)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Uredi
                  </button>
                  <button 
                    onClick={() => handleDelete(staffMember.id)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ukloni
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nema zaposlenih</h3>
          <p className="text-gray-600 mb-6">Dodajte zaposlene u vaš salon</p>
          <button 
            onClick={() => {
              resetForm();
              setEditingStaff(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Dodaj prvog zaposlenog
          </button>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingStaff ? 'Uredi zaposlenog' : 'Dodaj novog zaposlenog'}
                </h2>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStaff(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* General error message */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ime i prezime *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Marko Petrović"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tip zaposlenog *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Izaberite tip</option>
                    {Object.entries(StaffRoleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email {!editingStaff && '*'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="marko@salon.ba"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                  {editingStaff && (
                    <p className="mt-1 text-xs text-gray-500">
                      Ostavite prazno ako ne želite promijeniti email
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lozinka {!editingStaff && '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  {editingStaff ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Ostavite prazno ako ne želite promijeniti lozinku
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Mora sadržavati: najmanje 8 karaktera, jedno veliko slovo, jedno malo slovo i jedan broj
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+387 60 123 456"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis/Biografija
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kratka biografija, iskustvo, obrazovanje..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specijalnosti
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dodaj specijalnost..."
                  />
                  <button
                    onClick={addSpecialty}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(specialty)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usluge koje može da pruža
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {services.map(service => (
                    <label key={service.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={formData.service_ids.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              service_ids: [...prev.service_ids, service.id] 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              service_ids: prev.service_ids.filter(id => id !== service.id) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm">{service.name} - {service.category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Radno vreme</h3>
                <div className="space-y-4">
                  {['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja'].map((dayName, index) => {
                    const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][index];
                    const daySchedule = (formData.working_hours as any)[dayKey];
                    return (
                      <div key={dayKey} className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="w-24">
                          <label className="text-sm font-medium text-gray-700">{dayName}</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={daySchedule.is_working}
                            onChange={(e) => handleWorkingHoursChange(dayKey, 'is_working', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">Radi</span>
                          {daySchedule.is_working && (
                            <>
                              <input
                                type="time"
                                value={daySchedule.start}
                                onChange={(e) => handleWorkingHoursChange(dayKey, 'start', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-gray-400">-</span>
                              <input
                                type="time"
                                value={daySchedule.end}
                                onChange={(e) => handleWorkingHoursChange(dayKey, 'end', e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStaff(null);
                    resetForm();
                  }}
                  disabled={saving}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Čuvanje...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingStaff ? 'Sačuvaj izmene' : 'Dodaj zaposlenog'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}