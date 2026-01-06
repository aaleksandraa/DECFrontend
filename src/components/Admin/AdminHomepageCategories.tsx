import React, { useEffect, useState } from 'react';
import { homepageCategoriesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: number;
  name: string;
  slug: string;
  title: string;
  description: string;
  image_url: string | null;
  link_type: 'search' | 'url' | 'category';
  link_value: string;
  is_enabled: boolean;
  display_order: number;
}

interface Settings {
  enabled: boolean;
  mobile: boolean;
  desktop: boolean;
  layout: 'grid' | 'carousel';
}

// Sortable Category Item Component
const SortableCategoryItem: React.FC<{
  category: Category;
  uploadingImageId: number | null;
  onToggleEnabled: (id: number, currentValue: boolean) => void;
  onImageUpload: (id: number, file: File) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}> = ({ category, uploadingImageId, onToggleEnabled, onImageUpload, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 ${isDragging ? 'shadow-lg bg-blue-50' : 'bg-white'}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Image Preview */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {category.slug === 'frizeri' && '✂️'}
              {category.slug === 'berber' && '💈'}
              {category.slug === 'djeca' && '👶'}
              {category.slug === 'masaze' && '💆'}
              {category.slug === 'lice' && '✨'}
              {category.slug === 'nokti' && '💅'}
            </div>
          )}
        </div>

        {/* Category Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{category.title}</h3>
          <p className="text-sm text-gray-500">{category.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            Link: {category.link_type} - {category.link_value}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Upload Image */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(category.id, file);
              }}
              disabled={uploadingImageId === category.id}
            />
            <div className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              {uploadingImageId === category.id ? 'Uploading...' : 'Upload sliku'}
            </div>
          </label>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Uredi kategoriju"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Enable/Disable Toggle */}
          <button
            onClick={() => onToggleEnabled(category.id, category.is_enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              category.is_enabled ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                category.is_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Obriši kategoriju"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminHomepageCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({
    enabled: false,
    mobile: true,
    desktop: true,
    layout: 'grid'
  });
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await homepageCategoriesAPI.getAll();
      setCategories(data.categories);
      setSettings(data.settings);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Greška pri učitavanju kategorija');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (categoryId: number, currentValue: boolean) => {
    try {
      await homepageCategoriesAPI.update(categoryId, { is_enabled: !currentValue });
      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, is_enabled: !currentValue } : cat
      ));
      toast.success('Kategorija ažurirana');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Greška pri ažuriranju kategorije');
    }
  };

  const handleImageUpload = async (categoryId: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Molimo odaberite sliku');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Slika je prevelika (max 2MB)');
      return;
    }

    setUploadingImageId(categoryId);
    try {
      const result = await homepageCategoriesAPI.uploadImage(categoryId, file);
      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, image_url: result.category.image_url } : cat
      ));
      toast.success('Slika uspješno uploadovana');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Greška pri uploadu slike');
    } finally {
      setUploadingImageId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);

    const reorderedCategories = arrayMove(categories, oldIndex, newIndex);

    // Update display_order
    const updatedCategories = reorderedCategories.map((item, index) => ({
      ...item,
      display_order: index + 1
    }));

    setCategories(updatedCategories);

    try {
      await homepageCategoriesAPI.reorder(
        updatedCategories.map(item => ({ id: item.id, display_order: item.display_order }))
      );
      toast.success('Redoslijed ažuriran');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Greška pri ažuriranju redoslijeda');
      loadData(); // Reload on error
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    try {
      await homepageCategoriesAPI.updateSettings(updated);
      setSettings(updated);
      toast.success('Podešavanja ažurirana');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Greška pri ažuriranju podešavanja');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu kategoriju?')) {
      return;
    }

    try {
      await homepageCategoriesAPI.delete(categoryId);
      setCategories(categories.filter(cat => cat.id !== categoryId));
      toast.success('Kategorija obrisana');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Greška pri brisanju kategorije');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;

    try {
      const result = await homepageCategoriesAPI.update(editingCategory.id, {
        title: editingCategory.title,
        description: editingCategory.description,
        link_value: editingCategory.link_value,
      });
      
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id ? { ...cat, ...result.category } : cat
      ));
      
      setShowEditModal(false);
      setEditingCategory(null);
      toast.success('Kategorija ažurirana');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Greška pri ažuriranju kategorije');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kategorije na početnoj strani</h1>
        <p className="text-gray-600">Upravljajte kategorijama koje se prikazuju na početnoj strani</p>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Globalna podešavanja</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Omogući kategorije</label>
              <p className="text-sm text-gray-500">Prikaži kategorije na početnoj strani</p>
            </div>
            <button
              onClick={() => handleUpdateSettings({ enabled: !settings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Prikaži na mobilnom</label>
              <p className="text-sm text-gray-500">Zamijeni search sa kategorijama na mobilnom</p>
            </div>
            <button
              onClick={() => handleUpdateSettings({ mobile: !settings.mobile })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.mobile ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.mobile ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Prikaži na desktopu</label>
              <p className="text-sm text-gray-500">Prikaži kategorije ispod searcha na desktopu</p>
            </div>
            <button
              onClick={() => handleUpdateSettings({ desktop: !settings.desktop })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.desktop ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.desktop ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Kategorije</h2>
          <p className="text-sm text-gray-500">Prevucite kategorije da promijenite redoslijed</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map(cat => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  uploadingImageId={uploadingImageId}
                  onToggleEnabled={handleToggleEnabled}
                  onImageUpload={handleImageUpload}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Nema kategorija. Dodajte prvu kategoriju.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Uredi kategoriju</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Naslov
                  </label>
                  <input
                    type="text"
                    value={editingCategory.title}
                    onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Npr. Frizerski saloni"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opis
                  </label>
                  <textarea
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Kratak opis kategorije"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL / Link
                  </label>
                  <input
                    type="text"
                    value={editingCategory.link_value}
                    onChange={(e) => setEditingCategory({ ...editingCategory, link_value: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="/saloni?audience=men"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Primjeri:
                    <br />• <code className="bg-gray-100 px-2 py-1 rounded">/saloni</code> - Svi saloni
                    <br />• <code className="bg-gray-100 px-2 py-1 rounded">/saloni?audience=men</code> - Za muškarce
                    <br />• <code className="bg-gray-100 px-2 py-1 rounded">/saloni?audience=women</code> - Za žene
                    <br />• <code className="bg-gray-100 px-2 py-1 rounded">/saloni?audience=children</code> - Za djecu
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Sačuvaj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomepageCategories;
