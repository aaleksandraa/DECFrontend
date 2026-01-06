import { useState, useMemo } from 'react';
import { ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { ScissorsIcon } from '@heroicons/react/24/solid';
import { Service } from '../../types';
import { ServiceGallerySlider } from '../ServiceGallerySlider';
import { Lightbox } from '../Lightbox';

interface ServicesByCategoryProps {
  services: Service[];
  onBookService: (service: Service) => void;
  initialVisibleCount?: number;
  showGallery?: boolean; // Control whether to show service galleries
  categoryOrder?: string[]; // Custom category order from salon settings
}

// Category display names and icons
const categoryLabels: Record<string, string> = {
  'haircut': 'Šišanje',
  'coloring': 'Farbanje',
  'styling': 'Stilizacija',
  'treatment': 'Tretmani',
  'beard': 'Brada',
  'makeup': 'Šminkanje',
  'nails': 'Nokti',
  'massage': 'Masaža',
  'skincare': 'Njega kože',
  'waxing': 'Depilacija',
  'other': 'Ostalo',
};

const categoryEmojis: Record<string, string> = {
  'haircut': '✂️',
  'coloring': '🎨',
  'styling': '💇',
  'treatment': '💆',
  'beard': '🧔',
  'makeup': '💄',
  'nails': '💅',
  'massage': '🙌',
  'skincare': '✨',
  'waxing': '🪒',
  'other': '📦',
};

export default function ServicesByCategory({
  services,
  onBookService,
  initialVisibleCount = 3,
  showGallery = true,
  categoryOrder = []
}: ServicesByCategoryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, Service[]> = {};
    
    services.forEach(service => {
      const category = service.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });

    // Sort categories by custom order, then alphabetically
    const sortedCategories = Object.entries(grouped).sort(([catA], [catB]) => {
      const indexA = categoryOrder.indexOf(catA);
      const indexB = categoryOrder.indexOf(catB);
      if (indexA === -1 && indexB === -1) return catA.localeCompare(catB);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return sortedCategories;
  }, [services, categoryOrder]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ScissorsIcon className="w-6 h-6 text-orange-600" />
          Usluge
        </h2>
        <p className="text-gray-500 text-center py-8">Nema dostupnih usluga</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ScissorsIcon className="w-6 h-6 text-orange-600" />
        Usluge ({services.length})
      </h2>

      <div className="space-y-6">
        {servicesByCategory.map(([category, categoryServices]) => {
          const isExpanded = expandedCategories.has(category);
          const visibleServices = isExpanded 
            ? categoryServices 
            : categoryServices.slice(0, initialVisibleCount);
          const hasMore = categoryServices.length > initialVisibleCount;
          const hiddenCount = categoryServices.length - initialVisibleCount;

          return (
            <div key={category} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-800">
                  {categoryLabels[category] || category}
                </h3>
                <span className="text-sm text-gray-500">
                  ({categoryServices.length})
                </span>
              </div>

              {/* Services List */}
              <div className="space-y-2">
                {visibleServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    {/* Service Info Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0 sm:pr-3">
                        <h4 className="font-medium text-gray-900 text-sm md:text-base">
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                      {/* Mobile: duration, price, button in one row */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 flex-shrink-0">
                        {service.duration > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{service.duration} min</span>
                          </div>
                        )}
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 text-sm md:text-base">
                            {service.discount_price || service.price} KM
                          </div>
                          {service.discount_price && (
                            <div className="text-xs text-gray-400 line-through">
                              {service.price} KM
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onBookService(service)}
                          className="px-3 py-1.5 text-xs md:text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
                        >
                          Rezerviši
                        </button>
                      </div>
                    </div>

                    {/* Service Gallery */}
                    {showGallery && service.images && service.images.length > 0 && (
                      <ServiceGallerySlider
                        images={service.images}
                        onImageClick={(index) => {
                          setLightboxImages(service.images || []);
                          setLightboxIndex(index);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Show More / Less Button */}
              {hasMore && (
                <button
                  onClick={() => toggleCategory(category)}
                  className="mt-3 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUpIcon className="w-4 h-4" />
                      Prikaži manje
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="w-4 h-4" />
                      Pogledaj sve ({hiddenCount} više)
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {/* Lightbox for service images */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => {
            setLightboxIndex(null);
            setLightboxImages([]);
          }}
          onNext={() => setLightboxIndex((lightboxIndex + 1) % lightboxImages.length)}
          onPrev={() => setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length)}
        />
      )}
    </div>
  );
}
