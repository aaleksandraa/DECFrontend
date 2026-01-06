import React, { useState } from 'react';
import {
  PhotoIcon,
  XMarkIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';

interface ServiceImage {
  id: number;
  image_url: string;
  title?: string;
  description?: string;
  is_featured: boolean;
  order: number;
}

interface ServiceImageManagerProps {
  serviceId: number;
  images: ServiceImage[];
}

export const ServiceImageManager: React.FC<ServiceImageManagerProps> = ({
  serviceId,
  images: initialImages,
}) => {
  const [images, setImages] = useState<ServiceImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<ServiceImage | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', is_featured: false });

  const API_URL = import.meta.env.VITE_API_URL;

  // Upload new image
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Molimo odaberite sliku');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Slika je prevelika. Maksimalna veličina je 5MB.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `${API_URL}/services/${serviceId}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Add new image to state immediately - no alert, no refresh
      const newImage = response.data.image;
      setImages([...images, newImage]);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Greška pri dodavanju slike');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Delete image
  const handleDelete = async (imageId: number) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovu sliku?')) return;

    try {
      await axios.delete(`${API_URL}/services/${serviceId}/images/${imageId}`);
      // Remove from state immediately - no alert
      setImages(images.filter((img) => img.id !== imageId));
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'Greška pri brisanju slike');
    }
  };

  // Start editing
  const startEdit = (image: ServiceImage) => {
    setEditingImage(image);
    setEditForm({
      title: image.title || '',
      description: image.description || '',
      is_featured: image.is_featured,
    });
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingImage) return;

    try {
      const response = await axios.put(
        `${API_URL}/services/${serviceId}/images/${editingImage.id}`,
        editForm
      );

      // Update state immediately and close modal - no alert
      setImages(
        images.map((img) =>
          img.id === editingImage.id ? { ...img, ...response.data.image } : img
        )
      );
      setEditingImage(null);
    } catch (error: any) {
      console.error('Update error:', error);
      alert(error.response?.data?.message || 'Greška pri ažuriranju slike');
    }
  };

  // Move image up/down
  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    // Swap
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

    // Update order values
    const reorderedImages = newImages.map((img, idx) => ({
      id: img.id,
      order: idx + 1,
    }));

    // Update state immediately - smooth reordering
    setImages(newImages.map((img, idx) => ({ ...img, order: idx + 1 })));

    try {
      await axios.put(`${API_URL}/services/${serviceId}/images/reorder`, {
        images: reorderedImages,
      });
    } catch (error: any) {
      console.error('Reorder error:', error);
      alert(error.response?.data?.message || 'Greška pri promeni redosleda');
      // Revert on error
      setImages(images);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600">
            {uploading ? 'Dodavanje slike...' : 'Kliknite da dodate sliku'}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            PNG, JPG, WEBP do 5MB
          </span>
        </label>
      </div>

      {/* Images grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group bg-white rounded-lg shadow-md overflow-hidden animate-fade-in"
            >
              {/* Image */}
              <div className="aspect-video relative">
                <img
                  src={image.image_url}
                  alt={image.title || 'Service image'}
                  className="w-full h-full object-cover"
                />

                {/* Featured badge */}
                {image.is_featured && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <StarIconSolid className="w-3 h-3" />
                    Istaknuto
                  </div>
                )}

                {/* Order badge */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  #{index + 1}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                {image.title && (
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">
                    {image.title}
                  </h4>
                )}
                {image.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {image.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Move up */}
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, 'up')}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Pomeri gore"
                  >
                    <ArrowUpIcon className="w-4 h-4 text-gray-700" />
                  </button>
                )}

                {/* Move down */}
                {index < images.length - 1 && (
                  <button
                    onClick={() => moveImage(index, 'down')}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Pomeri dole"
                  >
                    <ArrowDownIcon className="w-4 h-4 text-gray-700" />
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => startEdit(image)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Izmeni"
                >
                  <PencilIcon className="w-4 h-4 text-blue-600" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Obriši"
                >
                  <TrashIcon className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Nema dodatih slika za ovu uslugu</p>
        </div>
      )}

      {/* Edit modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Izmeni sliku</h3>
              <button
                onClick={() => setEditingImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview */}
              <img
                src={editingImage.image_url}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naslov
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Npr. Kratka frizura"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Kratak opis slike..."
                />
              </div>

              {/* Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={editForm.is_featured}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_featured: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="is_featured"
                  className="ml-2 text-sm text-gray-700 flex items-center gap-1"
                >
                  <StarIcon className="w-4 h-4" />
                  Istakni ovu sliku
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingImage(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Otkaži
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
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
