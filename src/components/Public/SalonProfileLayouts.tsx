import React from 'react';
import { Link } from 'react-router-dom';
import { Salon } from '../../types';
import { 
  MapPinIcon, 
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

// Mobile Description Component with expand/collapse
interface MobileDescriptionProps {
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const MobileDescription: React.FC<MobileDescriptionProps> = ({ description, isExpanded, onToggle }) => {
  const MAX_LENGTH = 1000;
  const shouldTruncate = description.length > MAX_LENGTH;
  const displayText = shouldTruncate && !isExpanded 
    ? description.substring(0, MAX_LENGTH) 
    : description;

  return (
    <div className="md:hidden bg-white border-b">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">O salonu</h2>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
          {displayText}
          {shouldTruncate && !isExpanded && '...'}
        </p>
        {shouldTruncate && (
          <button
            onClick={onToggle}
            className="mt-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            {isExpanded ? 'Prikaži manje' : 'Više'}
          </button>
        )}
      </div>
    </div>
  );
};

interface SalonImage {
  id: number;
  url: string;
  is_primary?: boolean;
}

interface SalonHeroProps {
  salon: Salon;
  salonImages: SalonImage[];
  currentImageIndex: number;
  onPrevImage: () => void;
  onNextImage: () => void;
  onGoToImage: (index: number) => void;
  onOpenLightbox: (index: number) => void;
  onBookingClick: () => void;
  isDescriptionExpanded?: boolean;
  onToggleDescription?: () => void;
  // Favorite props
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  onToggleFavorite?: () => void;
  isLoggedIn?: boolean;
}

// =============================================================================
// CLASSIC LAYOUT - Current design with large hero
// =============================================================================
export const ClassicHero: React.FC<SalonHeroProps> = ({
  salon,
  salonImages,
  currentImageIndex,
  onPrevImage,
  onNextImage,
  onGoToImage,
  onOpenLightbox,
  onBookingClick,
  isDescriptionExpanded = false,
  onToggleDescription = () => {},
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite = () => {},
  isLoggedIn = false,
}) => {
  const primaryImage = salon.images?.find(img => img.is_primary) || salon.images?.[0];

  return (
    <>
      {/* Hero Section - Full height */}
      <div className="relative h-64 md:h-96 bg-gradient-to-r from-orange-600 to-red-600">
        {primaryImage?.url && (
          <img
            src={primaryImage.url}
            alt={salon.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Favorite Button - Top Right */}
        <button
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all disabled:opacity-50 z-10"
          title={isFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
        >
          {favoriteLoading ? (
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : isFavorite ? (
            <HeartSolid className="w-6 h-6 text-red-500" />
          ) : (
            <HeartIcon className="w-6 h-6 text-gray-600 hover:text-red-500 transition-colors" />
          )}
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 max-w-7xl mx-auto">
          <Link 
            to={salon.city_slug ? `/saloni/${salon.city_slug}` : '/pretraga'}
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {salon.city ? `Saloni u ${salon.city}` : 'Povratak'}
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-bold text-white">
                  {salon.name}
                </h1>
                {salon.is_verified && (
                  <CheckBadgeIcon className="w-6 h-6 md:w-8 md:h-8 text-green-400" title="Verificiran salon" />
                )}
              </div>
              
              <div className="flex flex-col gap-1 text-white/90 text-sm md:text-base">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span>{salon.address}, {salon.city}</span>
                </div>
                {salon.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <StarSolid key={s} className={`w-4 h-4 ${s <= Math.round(salon.rating) ? 'text-yellow-400' : 'text-white/30'}`} />
                      ))}
                    </div>
                    <span className="text-white/80">{salon.rating.toFixed(1)} ({salon.review_count} recenzija)</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onBookingClick}
              className="hidden md:flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              <CalendarDaysIcon className="w-5 h-5" />
              Zakaži termin
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Gallery */}
      <MobileGallery 
        salon={salon}
        salonImages={salonImages}
        currentImageIndex={currentImageIndex}
        onPrevImage={onPrevImage}
        onNextImage={onNextImage}
        onGoToImage={onGoToImage}
        onOpenLightbox={onOpenLightbox}
      />

      {/* Mobile Book Button */}
      <MobileBookButton onBookingClick={onBookingClick} />
    </>
  );
};

// =============================================================================
// CLASSIC WITH DESCRIPTION FIRST - Same as classic, but description before gallery on mobile
// =============================================================================
export const ClassicDescFirstHero: React.FC<SalonHeroProps> = ({
  salon,
  salonImages,
  currentImageIndex,
  onPrevImage,
  onNextImage,
  onGoToImage,
  onOpenLightbox,
  onBookingClick,
  isDescriptionExpanded = false,
  onToggleDescription = () => {},
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite = () => {},
  isLoggedIn = false,
}) => {
  const primaryImage = salon.images?.find(img => img.is_primary) || salon.images?.[0];

  return (
    <>
      {/* Hero Section - Full height (same as Classic) */}
      <div className="relative h-64 md:h-96 bg-gradient-to-r from-orange-600 to-red-600">
        {primaryImage?.url && (
          <img
            src={primaryImage.url}
            alt={salon.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Favorite Button - Top Right */}
        <button
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all disabled:opacity-50 z-10"
          title={isFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
        >
          {favoriteLoading ? (
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : isFavorite ? (
            <HeartSolid className="w-6 h-6 text-red-500" />
          ) : (
            <HeartIcon className="w-6 h-6 text-gray-600 hover:text-red-500 transition-colors" />
          )}
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 max-w-7xl mx-auto">
          <Link 
            to={salon.city_slug ? `/saloni/${salon.city_slug}` : '/pretraga'}
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {salon.city ? `Saloni u ${salon.city}` : 'Povratak'}
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-bold text-white">
                  {salon.name}
                </h1>
                {salon.is_verified && (
                  <CheckBadgeIcon className="w-6 h-6 md:w-8 md:h-8 text-green-400" title="Verificiran salon" />
                )}
              </div>
              
              <div className="flex flex-col gap-1 text-white/90 text-sm md:text-base">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span>{salon.address}, {salon.city}</span>
                </div>
                {salon.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <StarSolid key={s} className={`w-4 h-4 ${s <= Math.round(salon.rating) ? 'text-yellow-400' : 'text-white/30'}`} />
                      ))}
                    </div>
                    <span className="text-white/80">{salon.rating.toFixed(1)} ({salon.review_count} recenzija)</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onBookingClick}
              className="hidden md:flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              <CalendarDaysIcon className="w-5 h-5" />
              Zakaži termin
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: Description BEFORE Gallery */}
      {salon.description && (
        <MobileDescription 
          description={salon.description}
          isExpanded={isDescriptionExpanded}
          onToggle={onToggleDescription}
        />
      )}

      {/* Mobile Gallery - After description */}
      <MobileGallery 
        salon={salon}
        salonImages={salonImages}
        currentImageIndex={currentImageIndex}
        onPrevImage={onPrevImage}
        onNextImage={onNextImage}
        onGoToImage={onGoToImage}
        onOpenLightbox={onOpenLightbox}
      />

      {/* Mobile Book Button */}
      <MobileBookButton onBookingClick={onBookingClick} />
    </>
  );
};

// =============================================================================
// COMPACT LAYOUT - Smaller hero, description first
// =============================================================================
export const CompactHero: React.FC<SalonHeroProps> = ({
  salon,
  salonImages,
  currentImageIndex,
  onPrevImage,
  onNextImage,
  onGoToImage,
  onOpenLightbox,
  onBookingClick,
  isDescriptionExpanded = false,
  onToggleDescription = () => {},
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite = () => {},
  isLoggedIn = false,
}) => {
  const primaryImage = salon.images?.find(img => img.is_primary) || salon.images?.[0];

  return (
    <>
      {/* Hero Section - Compact (50% height) */}
      <div className="relative h-32 md:h-48 bg-gradient-to-r from-orange-600 to-red-600">
        {primaryImage?.url && (
          <img
            src={primaryImage.url}
            alt={salon.name}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Favorite Button - Top Right */}
        <button
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
          className="absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all disabled:opacity-50 z-10"
          title={isFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
        >
          {favoriteLoading ? (
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : isFavorite ? (
            <HeartSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
          )}
        </button>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 max-w-7xl mx-auto">
          <Link 
            to={salon.city_slug ? `/saloni/${salon.city_slug}` : '/pretraga'}
            className="inline-flex items-center text-white/80 hover:text-white text-sm mb-2"
          >
            <ArrowLeftIcon className="w-3 h-3 mr-1" />
            Povratak
          </Link>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {salon.name}
            </h1>
            {salon.is_verified && (
              <CheckBadgeIcon className="w-5 h-5 text-green-400" />
            )}
          </div>
        </div>
      </div>

      {/* Description Card - Immediately after hero on mobile */}
      <div className="md:hidden bg-white border-b">
        <div className="p-4">
          <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
            <MapPinIcon className="w-4 h-4" />
            <span>{salon.address}, {salon.city}</span>
          </div>
          
          {salon.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <StarSolid key={s} className={`w-4 h-4 ${s <= Math.round(salon.rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">{salon.rating.toFixed(1)} ({salon.review_count})</span>
            </div>
          )}
          
          {salon.description && (
            <p className="text-gray-700 text-sm leading-relaxed">
              {salon.description}
            </p>
          )}
        </div>
      </div>

      {/* Mobile Gallery - After description */}
      <MobileGallery 
        salon={salon}
        salonImages={salonImages}
        currentImageIndex={currentImageIndex}
        onPrevImage={onPrevImage}
        onNextImage={onNextImage}
        onGoToImage={onGoToImage}
        onOpenLightbox={onOpenLightbox}
      />

      {/* Mobile Book Button */}
      <MobileBookButton onBookingClick={onBookingClick} />
    </>
  );
};

// =============================================================================
// MODERN LAYOUT - Card-based with side-by-side on desktop, stacked on mobile
// =============================================================================
export const ModernHero: React.FC<SalonHeroProps> = ({
  salon,
  salonImages,
  currentImageIndex,
  onPrevImage,
  onNextImage,
  onGoToImage,
  onOpenLightbox,
  onBookingClick,
  isDescriptionExpanded = false,
  onToggleDescription = () => {},
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite = () => {},
  isLoggedIn = false,
}) => {
  return (
    <>
      {/* Modern Card Layout */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back Link */}
          <Link 
            to={salon.city_slug ? `/saloni/${salon.city_slug}` : '/pretraga'}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Povratak na pretragu
          </Link>
          
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
            {/* Favorite Button - Top Right of Card */}
            <button
              onClick={onToggleFavorite}
              disabled={favoriteLoading}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 z-10 border border-gray-100"
              title={isFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            >
              {favoriteLoading ? (
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : isFavorite ? (
                <HeartSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors" />
              )}
            </button>
            
            <div className="md:flex">
              {/* Image Side */}
              <div className="md:w-2/5 relative">
                {salonImages.length > 0 ? (
                  <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[200px]">
                    <img
                      src={salonImages[currentImageIndex]?.url}
                      alt={salon.name}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onOpenLightbox(currentImageIndex)}
                    />
                    {salonImages.length > 1 && (
                      <>
                        <button
                          onClick={onPrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow"
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={onNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow"
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                          {currentImageIndex + 1}/{salonImages.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[4/3] md:h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <span className="text-orange-300 text-6xl">✂️</span>
                  </div>
                )}
              </div>
              
              {/* Info Side */}
              <div className="md:w-3/5 p-5 md:p-8 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {salon.name}
                      </h1>
                      {salon.is_verified && (
                        <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{salon.address}, {salon.city}</span>
                    </div>
                  </div>
                  
                  {salon.rating > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <StarSolid className="w-5 h-5 text-yellow-400" />
                        <span className="text-xl font-bold text-gray-900">{salon.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-gray-500">{salon.review_count} recenzija</span>
                    </div>
                  )}
                </div>
                
                {salon.description && (
                  <p className="text-gray-600 text-sm md:text-base mb-6 flex-grow line-clamp-4 md:line-clamp-none">
                    {salon.description}
                  </p>
                )}
                
                {/* Thumbnail strip for desktop */}
                {salonImages.length > 1 && (
                  <div className="hidden md:flex gap-2 mb-4 overflow-x-auto pb-2">
                    {salonImages.slice(0, 5).map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => onGoToImage(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                          idx === currentImageIndex ? 'border-orange-500' : 'border-transparent'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {salonImages.length > 5 && (
                      <button
                        onClick={() => onOpenLightbox(5)}
                        className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium"
                      >
                        +{salonImages.length - 5}
                      </button>
                    )}
                  </div>
                )}
                
                <button
                  onClick={onBookingClick}
                  className="w-full md:w-auto md:self-start flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <CalendarDaysIcon className="w-5 h-5" />
                  Zakaži termin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// =============================================================================
// MINIMAL LAYOUT - Clean, content-focused
// =============================================================================
export const MinimalHero: React.FC<SalonHeroProps> = ({
  salon,
  salonImages,
  currentImageIndex: _currentImageIndex,
  onPrevImage: _onPrevImage,
  onNextImage: _onNextImage,
  onGoToImage: _onGoToImage,
  onOpenLightbox,
  onBookingClick,
  isDescriptionExpanded = false,
  onToggleDescription = () => {},
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite = () => {},
  isLoggedIn = false,
}) => {
  // Note: This layout uses its own image display style, so carousel functions are not used
  void _currentImageIndex; void _onPrevImage; void _onNextImage; void _onGoToImage;
  
  return (
    <>
      {/* Minimal Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {/* Back Link */}
          <Link 
            to={salon.city_slug ? `/saloni/${salon.city_slug}` : '/pretraga'}
            className="inline-flex items-center text-gray-500 hover:text-orange-600 text-sm mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Povratak
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left: Info */}
            <div className="flex gap-4">
              {/* Small Image */}
              {salonImages.length > 0 && (
                <div 
                  className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden cursor-pointer shadow-md relative"
                  onClick={() => onOpenLightbox(0)}
                >
                  <img
                    src={salonImages[0]?.url}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    {salon.name}
                  </h1>
                  {salon.is_verified && (
                    <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                  )}
                  {/* Favorite Button - Inline with title */}
                  <button
                    onClick={onToggleFavorite}
                    disabled={favoriteLoading}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-all disabled:opacity-50"
                    title={isFavorite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
                  >
                    {favoriteLoading ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : isFavorite ? (
                      <HeartSolid className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{salon.address}, {salon.city}</span>
                </div>
                
                {salon.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <StarSolid key={s} className={`w-4 h-4 ${s <= Math.round(salon.rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{salon.rating.toFixed(1)} ({salon.review_count})</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right: Book Button */}
            <button
              onClick={onBookingClick}
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <CalendarDaysIcon className="w-5 h-5" />
              Zakaži termin
            </button>
          </div>
          
          {/* Description */}
          {salon.description && (
            <p className="mt-4 text-gray-600 text-sm md:text-base max-w-3xl">
              {salon.description}
            </p>
          )}
          
          {/* Image thumbnails */}
          {salonImages.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {salonImages.slice(0, 6).map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => onOpenLightbox(idx)}
                  className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-500 transition-colors"
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {salonImages.length > 6 && (
                <button
                  onClick={() => onOpenLightbox(6)}
                  className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  +{salonImages.length - 6}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

const MobileGallery: React.FC<{
  salon: Salon;
  salonImages: SalonImage[];
  currentImageIndex: number;
  onPrevImage: () => void;
  onNextImage: () => void;
  onGoToImage: (index: number) => void;
  onOpenLightbox: (index: number) => void;
}> = ({ salon, salonImages, currentImageIndex, onPrevImage, onNextImage, onGoToImage, onOpenLightbox }) => {
  if (salonImages.length === 0) return null;
  
  return (
    <div className="md:hidden bg-white">
      <div className="relative">
        <div 
          className="relative aspect-[4/3] cursor-pointer overflow-hidden"
          onClick={() => onOpenLightbox(currentImageIndex)}
        >
          <img
            src={salonImages[currentImageIndex]?.url}
            alt={`${salon.name} - Slika ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
            {currentImageIndex + 1} / {salonImages.length}
          </div>
        </div>

        {salonImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 p-2 rounded-full shadow-lg"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {salonImages.length > 1 && (
        <div className="p-3 border-t">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {salonImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => onGoToImage(index)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${index === currentImageIndex ? 'border-orange-500' : 'border-transparent'}`}
              >
                <img src={image.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MobileBookButton: React.FC<{ onBookingClick: () => void }> = ({ onBookingClick }) => (
  <div className="md:hidden px-4 py-3 bg-gray-50">
    <button
      onClick={onBookingClick}
      className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-2.5 rounded-lg font-medium text-sm shadow-sm"
    >
      <CalendarDaysIcon className="w-4 h-4" />
      Zakaži termin
    </button>
  </div>
);
