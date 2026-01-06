import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, Save, X, Image, GripVertical, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { serviceAPI, staffAPI, salonAPI } from '../../services/api';
import { StaffRole, StaffRoleLabels } from '../../types';
import { ServiceImageManager } from '../Dashboard/ServiceImageManager';

export function SalonServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [managingImagesFor, setManagingImagesFor] = useState<any>(null);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggedService, setDraggedService] = useState<any>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: '',
    discount_price: '',
    category: '',
    custom_category: '',
    staff_ids: [] as string[]
  });

  const defaultCategories = ['Šišanje', 'Farbanje', 'Njega', 'Styling', 'Tretmani'];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.salon) return;
    
    try {
      setLoading(true);
      const [servicesData, staffData, salonData] = await Promise.all([
        serviceAPI.getServices(user.salon.id),
        staffAPI.getStaff(user.salon.id),
        salonAPI.getSalon(user.salon.id)
      ]);
      
      // Handle paginated or array response
      const servicesArray = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
      const staffArray = Array.isArray(staffData) ? staffData : (staffData?.data || []);
      
      // Sort services by display_order
      servicesArray.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      
      setServices(servicesArray);
      setStaff(staffArray);
      
      // Load category order from salon
      if (salonData?.category_order) {
        setCategoryOrder(salonData.category_order);
      }
      
      // Extract custom categories
      const categories = [...new Set(servicesArray.map((s: any) => s.category))] as string[];
      const custom = categories.filter((cat: string) => !defaultCategories.includes(cat));
      setCustomCategories(custom);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 30,
      price: '',
      discount_price: '',
      category: '',
      custom_category: '',
      staff_ids: []
    });
    setShowCustomCategory(false);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: String(service.price),
      discount_price: service.discount_price ? String(service.discount_price) : '',
      category: service.category,
      custom_category: '',
      staff_ids: service.staff_ids || []
    });
    
    if (!defaultCategories.includes(service.category)) {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, custom_category: service.category, category: 'custom' }));
    }
    
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!user?.salon) return;

    const finalCategory = formData.category === 'custom' ? formData.custom_category : formData.category;
    const priceValue = parseFloat(formData.price) || 0;
    
    if (!formData.name || !finalCategory || priceValue <= 0) {
      alert('Molimo unesite sve obavezne podatke');
      return;
    }

    try {
      const discountPriceValue = formData.discount_price ? parseFloat(formData.discount_price) : null;
      
      const serviceData = {
        ...formData,
        price: priceValue,
        discount_price: discountPriceValue,
        category: finalCategory
      };

      if (editingService) {
        // Update existing service
        const response = await serviceAPI.updateService(user.salon.id, editingService.id, serviceData);
        setServices(prev => prev.map(s => s.id === editingService.id ? response.service : s));
      } else {
        // Create new service
        const response = await serviceAPI.createService(user.salon.id, serviceData);
        setServices(prev => [...prev, response.service]);
      }
      
      setShowAddModal(false);
      setEditingService(null);
      resetForm();
      loadData(); // Reload to update categories
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Da li ste sigurni da želite da uklonite ovu uslugu?')) return;
    if (!user?.salon) return;
    
    try {
      await serviceAPI.deleteService(user.salon.id, serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const getServicesByCategory = (category: string) => {
    return services.filter(service => service.category === category);
  };

  // Sort categories by custom order, then default order
  const allCategories = [...defaultCategories, ...customCategories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Drag handlers for services
  const handleServiceDragStart = (e: React.DragEvent, service: any) => {
    setDraggedService(service);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleServiceDragOver = (e: React.DragEvent, targetService: any) => {
    e.preventDefault();
    if (!draggedService || draggedService.id === targetService.id) return;
    if (draggedService.category !== targetService.category) return;
    
    const newServices = [...services];
    const draggedIndex = newServices.findIndex(s => s.id === draggedService.id);
    const targetIndex = newServices.findIndex(s => s.id === targetService.id);
    
    newServices.splice(draggedIndex, 1);
    newServices.splice(targetIndex, 0, draggedService);
    
    // Update display_order
    newServices.forEach((s, i) => s.display_order = i);
    
    setServices(newServices);
    setHasOrderChanges(true);
  };

  const handleServiceDragEnd = () => {
    setDraggedService(null);
  };

  // Drag handlers for categories
  const handleCategoryDragStart = (e: React.DragEvent, category: string) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory === targetCategory) return;
    
    const currentOrder = [...allCategories];
    const draggedIndex = currentOrder.indexOf(draggedCategory);
    const targetIndex = currentOrder.indexOf(targetCategory);
    
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedCategory);
    
    setCategoryOrder(currentOrder);
    setHasOrderChanges(true);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategory(null);
  };

  // Save order changes
  const saveOrderChanges = async () => {
    if (!user?.salon) return;
    
    try {
      setSavingOrder(true);
      await serviceAPI.reorderServices(user.salon.id, {
        services: services.map((s, i) => ({ id: s.id, display_order: i })),
        category_order: categoryOrder.length > 0 ? categoryOrder : allCategories
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Upravljanje uslugama</h1>
        <div className="flex gap-2 flex-wrap">
          {isReordering ? (
            <>
              <button 
                onClick={() => {
                  setIsReordering(false);
                  setHasOrderChanges(false);
                  loadData(); // Reset to original order
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
                  setEditingService(null);
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Dodaj uslugu
              </button>
            </>
          )}
        </div>
      </div>
      
      {isReordering && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Način uređivanja:</strong> Povucite kategorije ili usluge da promijenite njihov redoslijed. 
            Ovaj redoslijed će se prikazivati na profilu salona i widgetu.
          </p>
        </div>
      )}

      {/* Services by Category */}
      <div className="space-y-6">
        {allCategories.map(category => {
          const categoryServices = getServicesByCategory(category);
          
          if (categoryServices.length === 0) return null;
          
          return (
            <div 
              key={category} 
              className={`bg-white rounded-xl shadow-sm border ${isReordering ? 'cursor-move' : ''} ${draggedCategory === category ? 'opacity-50' : ''}`}
              draggable={isReordering}
              onDragStart={(e) => isReordering && handleCategoryDragStart(e, category)}
              onDragOver={(e) => isReordering && handleCategoryDragOver(e, category)}
              onDragEnd={handleCategoryDragEnd}
            >
              <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center gap-3">
                {isReordering && (
                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                  <p className="text-sm text-gray-600">{categoryServices.length} usluga</p>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {categoryServices.map(service => (
                  <div 
                    key={service.id} 
                    className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${isReordering ? 'cursor-move' : ''} ${draggedService?.id === service.id ? 'opacity-50 bg-blue-50' : ''}`}
                    draggable={isReordering}
                    onDragStart={(e) => { e.stopPropagation(); isReordering && handleServiceDragStart(e, service); }}
                    onDragOver={(e) => { e.stopPropagation(); isReordering && handleServiceDragOver(e, service); }}
                    onDragEnd={handleServiceDragEnd}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 flex items-start gap-3">
                        {isReordering && (
                          <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">{service.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 flex-shrink-0">
                            {service.duration > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{service.duration} min</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {service.discount_price ? (
                                <div className="flex items-center gap-2">
                                  <span className="line-through text-gray-400">{service.price} KM</span>
                                  <span className="font-semibold text-red-600">{service.discount_price} KM</span>
                                </div>
                              ) : (
                                <span className="font-semibold text-green-600">{service.price} KM</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3 text-sm sm:text-base">{service.description}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Izvršioci:</span>
                          <div className="flex flex-wrap gap-1">
                            {service.staff?.map((staffMember: any) => (
                              <span 
                                key={staffMember.id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {staffMember.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        </div>
                      </div>
                      
                      {!isReordering && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button 
                          onClick={() => setManagingImagesFor(service)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Upravljaj slikama"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nema usluga</h3>
          <p className="text-gray-600 mb-6">Dodajte prve usluge vašeg salona</p>
          <button 
            onClick={() => {
              resetForm();
              setEditingService(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Dodaj prvu uslugu
          </button>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingService ? 'Uredi uslugu' : 'Dodaj novu uslugu'}
                </h2>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingService(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Naziv usluge *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Šišanje i feniranje"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorija *
                  </label>
                  <select 
                    value={formData.category}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, category: e.target.value }));
                      setShowCustomCategory(e.target.value === 'custom');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Izaberite kategoriju</option>
                    {defaultCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    {customCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="custom">+ Kreiraj novu kategoriju</option>
                  </select>
                </div>

                {showCustomCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova kategorija *
                    </label>
                    <input
                      type="text"
                      value={formData.custom_category}
                      onChange={(e) => setFormData(prev => ({ ...prev, custom_category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Unesite naziv kategorije"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trajanje (minuti) *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>0 minuta (dodatak - ne može se samostalno zakazati)</option>
                    <option value={15}>15 minuta</option>
                    <option value={30}>30 minuta</option>
                    <option value={45}>45 minuta</option>
                    <option value={60}>1 sat</option>
                    <option value={90}>1.5 sata</option>
                    <option value={120}>2 sata</option>
                    <option value={150}>2.5 sata</option>
                    <option value={180}>3 sata</option>
                    <option value={240}>4 sata</option>
                  </select>
                  {formData.duration === 0 && (
                    <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Ova usluga se ne može samostalno zakazati. Koristi se samo kao dodatak drugim uslugama (npr. pranje kose).
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cijena (KM) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.price}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty, numbers, and decimal point
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setFormData(prev => ({ ...prev, price: val }));
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="35"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Akcijska cijena (KM)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.discount_price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setFormData(prev => ({ ...prev, discount_price: val }));
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ostavite prazno ako nema akcije"
                  />
                  <p className="mt-1 text-xs text-gray-500">Ako je popunjeno, regularna cijena će biti precrtana</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis usluge
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Detaljan opis usluge..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zaposleni koji mogu da pružaju ovu uslugu
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {staff.map(staffMember => (
                    <label key={staffMember.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={formData.staff_ids.includes(staffMember.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              staff_ids: [...prev.staff_ids, staffMember.id] 
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              staff_ids: prev.staff_ids.filter(id => id !== staffMember.id) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm">{staffMember.name} - {StaffRoleLabels[staffMember.role as StaffRole] || staffMember.role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingService(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingService ? 'Sačuvaj izmjene' : 'Dodaj uslugu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Management Modal */}
      {managingImagesFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Galerija slika - {managingImagesFor.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Dodajte slike koje prikazuju rezultate ove usluge
                  </p>
                </div>
                <button 
                  onClick={() => setManagingImagesFor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <ServiceImageManager
                serviceId={managingImagesFor.id}
                images={managingImagesFor.images || []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}