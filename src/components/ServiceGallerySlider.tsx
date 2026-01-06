import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ServiceImage {
  id: number;
  image_url: string;
  title?: string;
  description?: string;
  is_featured: boolean;
  order: number;
}

interface ServiceGallerySliderProps {
  images: ServiceImage[];
  onImageClick: (index: number) => void;
}

export const ServiceGallerySlider: React.FC<ServiceGallerySliderProps> = ({
  images,
  onImageClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const imagesPerView = isMobile ? 2 : 4; // Show 2 on mobile, 4 on desktop

  if (!images || images.length === 0) return null;

  const totalSlides = Math.ceil(images.length / imagesPerView);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalSlides - 1;

  // Minimum swipe distance (in px) to trigger slide change
  const minSwipeDistance = 50;

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setShowSwipeHint(false); // Hide hint after first touch
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && canGoNext) {
      handleNext();
    }
    if (isRightSwipe && canGoPrev) {
      handlePrev();
    }
  };

  const startIndex = currentIndex * imagesPerView;
  const visibleImages = images.slice(startIndex, startIndex + imagesPerView);

  return (
    <div className="relative mt-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span>Galerija rezultata</span>
          <span className="text-xs text-gray-500">({images.length} {images.length === 1 ? 'slika' : 'slika'})</span>
        </h4>
        
        {/* Navigation arrows */}
        {totalSlides > 1 && (
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
              className={`p-1.5 rounded-full transition-colors ${
                canGoPrev
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Previous images"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={`p-1.5 rounded-full transition-colors ${
                canGoNext
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Next images"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Images slider */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 touch-pan-y select-none transition-opacity duration-300"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {visibleImages.map((image, idx) => {
          const globalIndex = startIndex + idx;
          return (
            <div
              key={image.id}
              onClick={() => onImageClick(globalIndex)}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-gray-100 animate-fadeIn"
            >
              <img
                src={image.image_url}
                alt={image.title || 'Service result'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>

              {/* Featured badge */}
              {image.is_featured && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-0.5">
                  <StarIconSolid className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Swipe hint for mobile - only show on first load and if multiple slides */}
      {showSwipeHint && totalSlides > 1 && (
        <div className="sm:hidden flex justify-center mt-2">
          <div className="text-xs text-gray-500 flex items-center gap-1 animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Prevucite za više slika</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      )}

      {/* Dots indicator */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-6 bg-purple-600'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
