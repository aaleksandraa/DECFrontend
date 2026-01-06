import React, { useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface LightboxProps {
  images: Array<{
    id: number;
    image_url: string;
    title?: string;
    description?: string;
  }>;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}) => {
  const currentImage = images[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 p-2 rounded-full hover:bg-white/10"
        aria-label="Close"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 p-2 rounded-full hover:bg-white/10"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="w-10 h-10 md:w-12 md:h-12" />
        </button>
      )}

      {/* Image container */}
      <div 
        className="max-w-7xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.image_url}
          alt={currentImage.title || 'Service image'}
          className="max-w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Image info */}
        {(currentImage.title || currentImage.description) && (
          <div className="text-center mt-6 max-w-2xl">
            {currentImage.title && (
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                {currentImage.title}
              </h3>
            )}
            {currentImage.description && (
              <p className="text-gray-300 text-sm md:text-base">
                {currentImage.description}
              </p>
            )}
          </div>
        )}

        {/* Image counter */}
        <div className="text-center mt-4 text-gray-400 text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 p-2 rounded-full hover:bg-white/10"
          aria-label="Next image"
        >
          <ChevronRightIcon className="w-10 h-10 md:w-12 md:h-12" />
        </button>
      )}
    </div>
  );
};
