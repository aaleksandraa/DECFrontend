import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { publicAPI, reviewAPI, favoriteAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAppearance } from '../../context/AppearanceContext';
import { Salon, Service, Staff, Review } from '../../types';
import { GuestBookingModal } from './GuestBookingModal';
import { MainNavbar } from '../Layout/MainNavbar';
import { PublicFooter } from './PublicFooter';
import ServicesByCategory from './ServicesByCategory';
import { StaffRoleLabels, StaffRole } from '../../types';
import { ClassicHero, ClassicDescFirstHero, CompactHero, ModernHero, MinimalHero } from './SalonProfileLayouts';
import { 
  MapPinIcon, 
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  StarIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid, ScissorsIcon } from '@heroicons/react/24/solid';
import { LoginPromptModal } from '../Common/LoginPromptModal';

// Lazy load map component
const SalonLocationMap = lazy(() => import('./SalonLocationMap'));

interface MetaData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  image?: string;
}

export const PublicSalonPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { salonProfileLayout } = useAppearance();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<Staff | undefined>();

  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  
  // Reviews carousel state
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Staff bio expanded state
  const [expandedStaffBio, setExpandedStaffBio] = useState<number | null>(null);

  // Description expanded state (for mobile)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStaffId, setReviewStaffId] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const reviewFormRef = useRef<HTMLDivElement>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check for writeReview query param
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (slug) {
      loadSalonData();
    }
  }, [slug]);

  // Handle writeReview query parameter
  useEffect(() => {
    if (searchParams.get('writeReview') === 'true' && user && !loading && salon) {
      setShowReviewForm(true);
      // Scroll to review form after a short delay
      setTimeout(() => {
        reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [searchParams, user, loading, salon]);

  const loadSalonData = async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load via public API (includes all data: services, staff, reviews)
      const data = await publicAPI.getSalonBySlug(slug);
      const salonData = data.salon?.data || data.salon;
      
      setSalon(salonData);
      setMeta(data.meta);
      setSchema(data.schema);
      
      // Use included data from the response (already loaded with salon)
      if (salonData) {
        setServices(salonData.services || []);
        setStaff(salonData.staff || []);
        setReviews(salonData.reviews || []);
      }
    } catch (err: any) {
      console.error('Error loading salon:', err);
      setError('Salon nije pronađen');
    } finally {
      setLoading(false);
    }
  };

  // Check favorite status when salon loads and user is logged in
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!salon || !user || user.role !== 'klijent') return;
      
      try {
        const { is_favorite } = await favoriteAPI.checkFavorite(String(salon.id));
        setIsFavorite(is_favorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkFavoriteStatus();
  }, [salon, user]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    if (!salon || !user) {
      // Show login prompt modal
      setShowLoginPrompt(true);
      return;
    }
    
    if (user.role !== 'klijent') {
      return; // Only clients can favorite
    }
    
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoriteAPI.removeFavorite(String(salon.id));
        setIsFavorite(false);
      } else {
        await favoriteAPI.addFavorite(String(salon.id));
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon || !user) return;

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const reviewData = {
        salon_id: salon.id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
        staff_id: reviewStaffId ? parseInt(reviewStaffId) : null,
      };

      await reviewAPI.createReview(reviewData);
      
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewComment('');
      setReviewStaffId('');
      
      // Reload salon data to show new review
      await loadSalonData();
      
      // Hide success message after 5 seconds
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setReviewError(err.response?.data?.message || 'Greška pri slanju recenzije. Možda ste već ocijenili ovaj salon.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBookService = (service: Service, staffMember?: Staff) => {
    setSelectedService(service);
    setSelectedStaff(staffMember);
    setShowBookingModal(true);
  };

  const handleBookWithStaff = (staffMember: Staff) => {
    // If staff has services, preselect the first one, otherwise just set the staff
    if (staffMember.services && staffMember.services.length > 0) {
      setSelectedService(staffMember.services[0]);
    } else {
      setSelectedService(undefined);
    }
    setSelectedStaff(staffMember);
    setShowBookingModal(true);
  };

  // Gallery navigation
  const salonImages = salon?.images || [];
  
  const nextImage = () => {
    if (salonImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % salonImages.length);
    }
  };

  const prevImage = () => {
    if (salonImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + salonImages.length) % salonImages.length);
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;
      
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, salonImages.length]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= Math.round(rating) ? (
            <StarSolid key={star} className="w-5 h-5 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="w-5 h-5 text-gray-300" />
          )
        ))}
      </div>
    );
  };

  const formatWorkingHours = (hours: any) => {
    if (!hours) return null;
    
    const days = {
      monday: 'Ponedjeljak',
      tuesday: 'Utorak',
      wednesday: 'Srijeda',
      thursday: 'Četvrtak',
      friday: 'Petak',
      saturday: 'Subota',
      sunday: 'Nedjelja'
    };

    return Object.entries(days).map(([key, name]) => {
      const dayHours = hours[key];
      return {
        day: name,
        hours: dayHours?.is_open ? `${dayHours.open} - ${dayHours.close}` : 'Zatvoreno'
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje salona...</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ScissorsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">{error || 'Salon nije pronađen'}</h1>
          <Link to="/pretraga" className="text-orange-600 hover:underline">
            ← Povratak na pretragu
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = salon.images?.find(img => img.is_primary) || salon.images?.[0];

  return (
    <>
      <Helmet>
        <title>{meta?.title || `${salon.name} | Frizersko-Kozmetički Salon`}</title>
        <meta name="description" content={meta?.description || salon.description} />
        {meta?.keywords && (
          <meta name="keywords" content={meta.keywords.join(', ')} />
        )}
        <link rel="canonical" href={meta?.canonical || `/salon/${salon.slug || salon.id}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={meta?.title || salon.name} />
        <meta property="og:description" content={meta?.description || salon.description} />
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={meta?.canonical} />
        {(meta?.image || primaryImage?.url) && (
          <meta property="og:image" content={meta?.image || primaryImage?.url} />
        )}

        {/* JSON-LD Schema */}
        {schema && (
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        )}
      </Helmet>

      <MainNavbar />

      <div className="min-h-screen bg-gray-50">
        {/* Dynamic Hero Layout */}
        {(() => {
          const heroProps = {
            salon,
            salonImages,
            currentImageIndex,
            onPrevImage: prevImage,
            onNextImage: nextImage,
            onGoToImage: goToImage,
            onOpenLightbox: openLightbox,
            onBookingClick: () => setShowBookingModal(true),
            isDescriptionExpanded,
            onToggleDescription: () => setIsDescriptionExpanded(!isDescriptionExpanded),
            // Favorite props
            isFavorite,
            favoriteLoading,
            onToggleFavorite: handleToggleFavorite,
            isLoggedIn: !!user,
          };

          switch (salonProfileLayout) {
            case 'classic-desc-first':
              return <ClassicDescFirstHero {...heroProps} />;
            case 'compact-hero':
              return <CompactHero {...heroProps} />;
            case 'modern-card':
              return <ModernHero {...heroProps} />;
            case 'description-first':
              return <MinimalHero {...heroProps} />;
            case 'classic':
            default:
              return <ClassicHero {...heroProps} />;
          }
        })()}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Image Gallery Carousel - Desktop only, hide for modern/minimal layouts */}
              {salonImages.length > 0 && (salonProfileLayout === 'classic' || salonProfileLayout === 'classic-desc-first' || salonProfileLayout === 'compact-hero') && (
                <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                  
                  {/* Main Carousel */}
                  <div className="relative">
                    {/* Main Image */}
                    <div 
                      className="relative aspect-[16/9] md:aspect-[2/1] cursor-pointer overflow-hidden"
                      onClick={() => openLightbox(currentImageIndex)}
                    >
                      <img
                        src={salonImages[currentImageIndex]?.url}
                        alt={`${salon.name} - Slika ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {salonImages.length}
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    {salonImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                          aria-label="Prethodna slika"
                        >
                          <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110"
                          aria-label="Sljedeća slika"
                        >
                          <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {salonImages.length > 1 && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                        {salonImages.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => goToImage(index)}
                            className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentImageIndex 
                                ? 'border-orange-600 ring-2 ring-orange-200' 
                                : 'border-transparent hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={`${salon.name} - Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description - Hidden on mobile (shown in hero) */}
              {salon.description && (
                <div className="hidden md:block bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">O salonu</h2>
                  <p className="text-gray-600 leading-relaxed">{salon.description}</p>
                </div>
              )}

              {/* Services Section - Grouped by Category */}
              <ServicesByCategory 
                services={services} 
                onBookService={handleBookService}
                initialVisibleCount={3}
                showGallery={salon?.show_service_gallery !== false}
                categoryOrder={salon?.category_order || []}
              />

              {/* Staff Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserGroupIcon className="w-6 h-6 text-orange-600" />
                  Osoblje ({staff.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staff.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 col-span-2">Nema dostupnog osoblja</p>
                  ) : (
                    staff.map((member) => {
                      const hasBio = member.bio && member.bio.trim().length > 0;
                      const isExpanded = expandedStaffBio === member.id;
                      const bioLength = member.bio?.length || 0;
                      const shouldTruncate = bioLength > 100;
                      
                      return (
                        <div
                          key={member.id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors group"
                        >
                          <div className="flex items-start gap-4">
                            <Link 
                              to={member.slug ? `/profil/${member.slug}` : '#'}
                              className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-orange-400 transition-all"
                            >
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <UserGroupIcon className="w-8 h-8 text-orange-400" />
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link 
                                to={member.slug ? `/profil/${member.slug}` : '#'}
                                className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                              >
                                {member.name}
                              </Link>
                              <p className="text-sm text-orange-600">
                                {StaffRoleLabels[member.role as StaffRole] || member.role}
                              </p>
                              {member.services && member.services.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {member.services.length} usluga
                                </p>
                              )}
                              {member.slug && (
                                <Link
                                  to={`/profil/${member.slug}`}
                                  className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1 inline-block"
                                >
                                  Pogledaj profil →
                                </Link>
                              )}
                            </div>
                            <button
                              onClick={() => handleBookWithStaff(member)}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
                            >
                              Rezerviši →
                            </button>
                          </div>
                          
                          {/* Staff Bio/Description */}
                          {hasBio && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {shouldTruncate && !isExpanded 
                                  ? `${member.bio!.substring(0, 100)}...`
                                  : member.bio
                                }
                              </p>
                              {shouldTruncate && (
                                <button
                                  onClick={() => setExpandedStaffBio(isExpanded ? null : member.id)}
                                  className="text-sm text-orange-600 hover:text-orange-700 font-medium mt-1"
                                >
                                  {isExpanded ? 'Prikaži manje' : 'Pogledaj više'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Reviews Section - Carousel */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <StarIcon className="w-6 h-6 text-orange-600" />
                    Recenzije ({reviews.length})
                  </h2>
                  {reviews.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentReviewIndex((prev) => 
                          prev === 0 ? reviews.length - 1 : prev - 1
                        )}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                      </button>
                      <span className="text-sm text-gray-500">
                        {currentReviewIndex + 1} / {reviews.length}
                      </span>
                      <button
                        onClick={() => setCurrentReviewIndex((prev) => 
                          prev === reviews.length - 1 ? 0 : prev + 1
                        )}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Još nema recenzija. Budite prvi koji će ostaviti utisak!</p>
                ) : (
                  <div className="relative overflow-hidden">
                    <div 
                      className="flex transition-transform duration-300 ease-in-out"
                      style={{ transform: `translateX(-${currentReviewIndex * 100}%)` }}
                    >
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="w-full flex-shrink-0 px-1"
                        >
                          <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold">
                                  {(review.client?.name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900 block">
                                    {review.client?.name || 'Anonimno'}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.created_at).toLocaleDateString('bs-BA', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                                "{review.comment}"
                              </p>
                            )}
                            {review.response && (
                              <div className="mt-4 pl-4 border-l-4 border-orange-300 bg-white/50 rounded-r-lg p-3">
                                <p className="text-sm text-gray-600">
                                  <span className="font-semibold text-orange-600">Odgovor salona:</span>{' '}
                                  {typeof review.response === 'string' ? review.response : review.response.text}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Carousel dots */}
                    {reviews.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {reviews.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentReviewIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentReviewIndex
                                ? 'bg-orange-600'
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Review Success Message */}
                {reviewSuccess && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-center font-medium">
                      ✓ Hvala! Vaša recenzija je uspješno poslana.
                    </p>
                  </div>
                )}

                {/* Info about reviews */}
                <div ref={reviewFormRef} className="mt-6 border-t pt-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">
                      💡 Recenzije mogu ostavljati samo klijenti koji su posjetili salon.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontakt</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPinIcon className="w-5 h-5 text-orange-600" />
                    <span>{salon.address}, {salon.postal_code} {salon.city}</span>
                  </div>
                  {salon.phone && (
                    <a href={`tel:${salon.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-orange-600">
                      <PhoneIcon className="w-5 h-5 text-orange-600" />
                      <span>{salon.phone}</span>
                    </a>
                  )}
                  {salon.email && (
                    <a href={`mailto:${salon.email}`} className="flex items-center gap-3 text-gray-600 hover:text-orange-600">
                      <EnvelopeIcon className="w-5 h-5 text-orange-600" />
                      <span>{salon.email}</span>
                    </a>
                  )}
                  {salon.website && (
                    <a href={salon.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-orange-600">
                      <GlobeAltIcon className="w-5 h-5 text-orange-600" />
                      <span>Web stranica</span>
                    </a>
                  )}
                  
                  {/* Social Media Links */}
                  {(salon.social_media?.facebook || salon.social_media?.instagram || salon.social_media?.twitter || salon.social_media?.tiktok || salon.social_media?.linkedin) && (
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100 mt-3 flex-wrap">
                      {salon.social_media?.facebook && (
                        <a 
                          href={salon.social_media.facebook.startsWith('http') ? salon.social_media.facebook : `https://facebook.com/${salon.social_media.facebook}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                          title="Facebook"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                      )}
                      {salon.social_media?.instagram && (
                        <a 
                          href={salon.social_media.instagram.startsWith('http') ? salon.social_media.instagram : `https://instagram.com/${salon.social_media.instagram}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 rounded-full flex items-center justify-center transition-all"
                          title="Instagram"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                      )}
                      {salon.social_media?.twitter && (
                        <a 
                          href={salon.social_media.twitter.startsWith('http') ? salon.social_media.twitter : `https://x.com/${salon.social_media.twitter}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-10 h-10 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors"
                          title="X (Twitter)"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      )}
                      {salon.social_media?.tiktok && (
                        <a 
                          href={salon.social_media.tiktok.startsWith('http') ? salon.social_media.tiktok : `https://tiktok.com/@${salon.social_media.tiktok}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-10 h-10 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center transition-colors"
                          title="TikTok"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                          </svg>
                        </a>
                      )}
                      {salon.social_media?.linkedin && (
                        <a 
                          href={salon.social_media.linkedin.startsWith('http') ? salon.social_media.linkedin : `https://linkedin.com/company/${salon.social_media.linkedin}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-10 h-10 bg-blue-700 hover:bg-blue-800 rounded-full flex items-center justify-center transition-colors"
                          title="LinkedIn"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              {salon.working_hours && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Radno vrijeme</h2>
                  <div className="space-y-2">
                    {formatWorkingHours(salon.working_hours)?.map((day) => (
                      <div key={day.day} className="flex justify-between text-sm">
                        <span className="text-gray-600">{day.day}</span>
                        <span className={day.hours === 'Zatvoreno' ? 'text-red-500' : 'text-gray-900 font-medium'}>
                          {day.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Audience */}
              {salon.target_audience && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Za koga</h2>
                  <div className="flex flex-wrap gap-2">
                    {salon.target_audience.men && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                        Muškarci
                      </span>
                    )}
                    {salon.target_audience.women && (
                      <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-sm">
                        Žene
                      </span>
                    )}
                    {salon.target_audience.children && (
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
                        Djeca
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities / Pogodnosti */}
              {salon.amenities && salon.amenities.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pogodnosti</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {salon.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">
                          ✓
                        </span>
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Map */}
              {salon.latitude && salon.longitude && (
                <Suspense fallback={
                  <div className="bg-white rounded-lg shadow-sm p-6 h-80 flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Učitavanje mape...</div>
                  </div>
                }>
                  <SalonLocationMap
                    latitude={salon.latitude}
                    longitude={salon.longitude}
                    salonName={salon.name}
                    address={`${salon.address}, ${salon.city}`}
                    googleMapsUrl={salon.google_maps_url}
                  />
                </Suspense>
              )}

              {/* CTA */}
              <div className="bg-orange-50 rounded-lg p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Želite li zakazati termin?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Rezervišite online bez čekanja
                </p>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Zakaži termin
                </button>
                {!user && (
                  <p className="text-xs text-gray-500 mt-2">
                    Možete rezervisati kao gost ili se <Link to="/login" className="text-orange-600 hover:underline">prijaviti</Link>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && salonImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
            aria-label="Zatvori galeriju"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 text-white/80 text-lg">
            {currentImageIndex + 1} / {salonImages.length}
          </div>

          {/* Main Image */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={salonImages[currentImageIndex]?.url}
              alt={`${salon.name} - Slika ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Navigation Arrows */}
          {salonImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 md:p-3 bg-black/30 hover:bg-black/50 rounded-full transition-all"
                aria-label="Prethodna slika"
              >
                <ChevronLeftIcon className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 md:p-3 bg-black/30 hover:bg-black/50 rounded-full transition-all"
                aria-label="Sljedeća slika"
              >
                <ChevronRightIcon className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </>
          )}

          {/* Thumbnail Strip at Bottom */}
          {salonImages.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4">
              <div className="flex gap-2 overflow-x-auto max-w-full pb-2">
                {salonImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={(e) => { e.stopPropagation(); goToImage(index); }}
                    className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-orange-500 opacity-100' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${salon.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guest Booking Modal */}
      {showBookingModal && (
        <GuestBookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(undefined);
            setSelectedStaff(undefined);
          }}
          salon={{ 
            id: Number(salon.id), 
            name: salon.name, 
            slug: salon.slug,
            working_hours: salon.working_hours,
            salon_breaks: salon.salon_breaks,
            salon_vacations: salon.salon_vacations
          }}
          services={services}
          staff={staff}
          preselectedService={selectedService}
          preselectedStaff={selectedStaff}
          user={user}
        />
      )}

      <PublicFooter />
      
      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnTo={`/salon/${slug}`}
      />
    </>
  );
};

export default PublicSalonPage;
