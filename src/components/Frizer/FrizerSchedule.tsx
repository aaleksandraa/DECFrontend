import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Coffee,
  Plane,
  User,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { staffAPI, scheduleAPI } from '../../services/api';
import { formatDateEuropean, getCurrentDateEuropean } from '../../utils/dateUtils';
import { TimeInput24h } from '../Common/TimeInput24h';
import { StaffRole, StaffRoleLabels } from '../../types';

export function FrizerSchedule() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any>(null);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [editingBreak, setEditingBreak] = useState<any>(null);
  const [editingVacation, setEditingVacation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [breakForm, setBreakForm] = useState({
    title: '',
    type: 'daily' as any,
    start_time: '12:00',
    end_time: '13:00',
    days: [] as string[],
    date: getCurrentDateEuropean(),
    start_date: getCurrentDateEuropean(),
    end_date: getCurrentDateEuropean()
  });

  const [vacationForm, setVacationForm] = useState({
    title: '',
    start_date: getCurrentDateEuropean(),
    end_date: getCurrentDateEuropean(),
    type: 'vacation' as any,
    notes: ''
  });

  const dayNames = [
    { key: 'monday', label: 'Ponedeljak' },
    { key: 'tuesday', label: 'Utorak' },
    { key: 'wednesday', label: 'Sreda' },
    { key: 'thursday', label: 'Četvrtak' },
    { key: 'friday', label: 'Petak' },
    { key: 'saturday', label: 'Subota' },
    { key: 'sunday', label: 'Nedelja' }
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.staff_profile) return;

    try {
      setLoading(true);
      
      // Load staff data
      const staffData = await staffAPI.getStaffMember(user.staff_profile.salon_id, user.staff_profile.id);
      setStaff(staffData);

      // Load breaks and vacations
      const [breaksData, vacationsData] = await Promise.all([
        scheduleAPI.getStaffBreaks(user.staff_profile.id),
        scheduleAPI.getStaffVacations(user.staff_profile.id)
      ]);

      setBreaks(breaksData.breaks || []);
      setVacations(vacationsData.vacations || []);
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetBreakForm = () => {
    setBreakForm({
      title: '',
      type: 'daily',
      start_time: '12:00',
      end_time: '13:00',
      days: [],
      date: getCurrentDateEuropean(),
      start_date: getCurrentDateEuropean(),
      end_date: getCurrentDateEuropean()
    });
  };

  const resetVacationForm = () => {
    setVacationForm({
      title: '',
      start_date: getCurrentDateEuropean(),
      end_date: getCurrentDateEuropean(),
      type: 'vacation',
      notes: ''
    });
  };

  const handleAddBreak = () => {
    setEditingBreak(null);
    resetBreakForm();
    setShowBreakModal(true);
  };

  const handleEditBreak = (breakItem: any) => {
    setEditingBreak(breakItem);
    setBreakForm({
      title: breakItem.title,
      type: breakItem.type,
      start_time: breakItem.start_time,
      end_time: breakItem.end_time,
      days: breakItem.days || [],
      date: breakItem.date || getCurrentDateEuropean(),
      start_date: breakItem.start_date || getCurrentDateEuropean(),
      end_date: breakItem.end_date || getCurrentDateEuropean()
    });
    setShowBreakModal(true);
  };

  const handleSaveBreak = async () => {
    const staffId = staff?.id || user?.staff_profile?.id;
    if (!breakForm.title || !breakForm.start_time || !breakForm.end_time || !staffId) {
      alert('Molimo unesite sve obavezne podatke');
      return;
    }

    try {
      if (editingBreak) {
        await scheduleAPI.updateStaffBreak(staffId, editingBreak.id, breakForm);
      } else {
        await scheduleAPI.createStaffBreak(staffId, breakForm);
      }
      
      loadData(); // Refresh data
      setShowBreakModal(false);
      resetBreakForm();
    } catch (error) {
      console.error('Error saving break:', error);
    }
  };

  const handleDeleteBreak = async (breakId: string) => {
    const staffId = staff?.id || user?.staff_profile?.id;
    if (!window.confirm('Da li ste sigurni da želite da uklonite ovu pauzu?') || !staffId) return;

    try {
      await scheduleAPI.deleteStaffBreak(staffId, breakId);
      setBreaks(prev => prev.filter(b => b.id !== breakId));
    } catch (error) {
      console.error('Error deleting break:', error);
    }
  };

  const handleAddVacation = () => {
    setEditingVacation(null);
    resetVacationForm();
    setShowVacationModal(true);
  };

  const handleSaveVacation = async () => {
    const staffId = staff?.id || user?.staff_profile?.id;
    if (!vacationForm.title || !vacationForm.start_date || !vacationForm.end_date || !staffId) {
      alert('Molimo unesite sve obavezne podatke');
      return;
    }

    try {
      if (editingVacation) {
        await scheduleAPI.updateStaffVacation(staffId, editingVacation.id, vacationForm);
      } else {
        await scheduleAPI.createStaffVacation(staffId, vacationForm);
      }
      
      loadData(); // Refresh data
      setShowVacationModal(false);
      resetVacationForm();
    } catch (error) {
      console.error('Error saving vacation:', error);
    }
  };

  const handleDeleteVacation = async (vacationId: string) => {
    const staffId = staff?.id || user?.staff_profile?.id;
    if (!window.confirm('Da li ste sigurni da želite da uklonite ovaj odmor?') || !staffId) return;

    try {
      await scheduleAPI.deleteStaffVacation(staffId, vacationId);
      setVacations(prev => prev.filter(v => v.id !== vacationId));
    } catch (error) {
      console.error('Error deleting vacation:', error);
    }
  };

  const getBreakTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Dnevno';
      case 'weekly': return 'Nedeljno';
      case 'specific_date': return 'Određeni datum';
      case 'date_range': return 'Period';
      default: return type;
    }
  };

  const getVacationTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Godišnji odmor';
      case 'sick_leave': return 'Bolovanje';
      case 'personal': return 'Lični razlozi';
      case 'other': return 'Ostalo';
      default: return type;
    }
  };

  const getBreakTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'specific_date': return 'bg-yellow-100 text-yellow-800';
      case 'date_range': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVacationTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-green-100 text-green-800';
      case 'sick_leave': return 'bg-red-100 text-red-800';
      case 'personal': return 'bg-blue-100 text-blue-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (!staff) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profil nije pronađen</h3>
        <p className="text-gray-600">Kontaktirajte administratora salona da vam kreira profil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moj raspored</h1>
          <p className="text-gray-600">{staff.name} - {StaffRoleLabels[staff.role as StaffRole] || staff.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breaks */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-orange-600" />
                Moje pauze
              </h3>
              <button
                onClick={handleAddBreak}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Dodaj pauzu
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {breaks.map(breakItem => (
                <div key={breakItem.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{breakItem.title}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditBreak(breakItem)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBreak(breakItem.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tip:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBreakTypeColor(breakItem.type)}`}>
                        {getBreakTypeLabel(breakItem.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vreme:</span>
                      <span className="font-medium">{breakItem.start_time} - {breakItem.end_time}</span>
                    </div>

                    {breakItem.type === 'weekly' && breakItem.days && (
                      <div>
                        <span className="text-gray-600">Dani:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {breakItem.days.map((day: string) => (
                            <span key={day} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {dayNames.find(d => d.key === day)?.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {breakItem.type === 'specific_date' && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Datum:</span>
                        <span className="font-medium">{breakItem.date}</span>
                      </div>
                    )}

                    {breakItem.type === 'date_range' && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Period:</span>
                        <span className="font-medium">{breakItem.start_date} - {breakItem.end_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {breaks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nema definisanih pauza</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vacations */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Plane className="w-5 h-5 text-orange-600" />
                Moji odmori
              </h3>
              <button
                onClick={handleAddVacation}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Dodaj odmor
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {vacations.map(vacation => (
                <div key={vacation.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{vacation.title}</h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDeleteVacation(vacation.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tip:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVacationTypeColor(vacation.type)}`}>
                        {getVacationTypeLabel(vacation.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Period:</span>
                      <span className="font-medium">{vacation.start_date} - {vacation.end_date}</span>
                    </div>

                    {vacation.notes && (
                      <div>
                        <span className="text-gray-600">Napomene:</span>
                        <p className="text-gray-900 mt-1">{vacation.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {vacations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nema definisanih odmora</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBreak ? 'Uredi pauzu' : 'Dodaj novu pauzu'}
                </h2>
                <button onClick={() => setShowBreakModal(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naziv pauze *
                </label>
                <input
                  type="text"
                  value={breakForm.title}
                  onChange={(e) => setBreakForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ručak, Pauza, Sastanak..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tip pauze *
                </label>
                <select
                  value={breakForm.type}
                  onChange={(e) => setBreakForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="daily">Dnevno (svaki dan)</option>
                  <option value="weekly">Nedeljno (određeni dani u nedelji)</option>
                  <option value="specific_date">Određeni datum</option>
                  <option value="date_range">Period (od-do)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Početno vreme *
                  </label>
                  <TimeInput24h
                    value={breakForm.start_time}
                    onChange={(value) => setBreakForm(prev => ({ ...prev, start_time: value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Završno vreme *
                  </label>
                  <TimeInput24h
                    value={breakForm.end_time}
                    onChange={(value) => setBreakForm(prev => ({ ...prev, end_time: value }))}
                  />
                </div>
              </div>

              {breakForm.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dani u nedelji
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {dayNames.map(day => (
                      <label key={day.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={breakForm.days.includes(day.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBreakForm(prev => ({ ...prev, days: [...prev.days, day.key] }));
                            } else {
                              setBreakForm(prev => ({ ...prev, days: prev.days.filter(d => d !== day.key) }));
                            }
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {breakForm.type === 'specific_date' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Datum
                  </label>
                  <input
                    type="date"
                    value={breakForm.date.split('.').reverse().join('-')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setBreakForm(prev => ({ ...prev, date: formatDateEuropean(date) }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              )}

              {breakForm.type === 'date_range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Od datuma
                    </label>
                    <input
                      type="date"
                      value={breakForm.start_date.split('.').reverse().join('-')}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        setBreakForm(prev => ({ ...prev, start_date: formatDateEuropean(date) }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do datuma
                    </label>
                    <input
                      type="date"
                      value={breakForm.end_date.split('.').reverse().join('-')}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        setBreakForm(prev => ({ ...prev, end_date: formatDateEuropean(date) }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => setShowBreakModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleSaveBreak}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingBreak ? 'Sačuvaj izmene' : 'Dodaj pauzu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vacation Modal */}
      {showVacationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingVacation ? 'Uredi odmor' : 'Dodaj novi odmor'}
                </h2>
                <button onClick={() => setShowVacationModal(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Naziv *
                </label>
                <input
                  type="text"
                  value={vacationForm.title}
                  onChange={(e) => setVacationForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Godišnji odmor, Bolovanje, Lični razlozi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tip odmora *
                </label>
                <select
                  value={vacationForm.type}
                  onChange={(e) => setVacationForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="vacation">Godišnji odmor</option>
                  <option value="sick_leave">Bolovanje</option>
                  <option value="personal">Lični razlozi</option>
                  <option value="other">Ostalo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Od datuma *
                  </label>
                  <input
                    type="date"
                    value={vacationForm.start_date.split('.').reverse().join('-')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setVacationForm(prev => ({ ...prev, start_date: formatDateEuropean(date) }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do datuma *
                  </label>
                  <input
                    type="date"
                    value={vacationForm.end_date.split('.').reverse().join('-')}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setVacationForm(prev => ({ ...prev, end_date: formatDateEuropean(date) }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Napomene
                </label>
                <textarea
                  value={vacationForm.notes}
                  onChange={(e) => setVacationForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Dodatne informacije..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => setShowVacationModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Otkaži
              </button>
              <button
                onClick={handleSaveVacation}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingVacation ? 'Sačuvaj izmene' : 'Dodaj odmor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}