import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainNavbar } from '../components/Layout/MainNavbar';
import { PublicFooter } from '../components/Public/PublicFooter';
import { GuestBookingModal } from '../components/Public/GuestBookingModal';
import { 
  StarIcon, 
  MapPinIcon, 
  PhoneIcon, 
  CalendarDaysIcon,
  AcademicCapIcon,
  TrophyIcon,
  LanguageIcon,
  ClockIcon,
  CheckBadgeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Lightbox } from '../components/Lightbox';
import { ServiceGallerySlider } from '../components/ServiceGallerySlider';

interface StaffProfile {
  id: number;
  name: string;
  slug: string;
  title?: string;
  role: string;
  bio?: string;
  bio_long?: string;
  profile_image?: string;
  avatar?: string;
  years_experience?: number;
  education?: Array<{ school: string; degree: string; year: string }>;
  achievements?: Array<{ title: string; description: string; year: string }>;
  languages?: string[];
  specialties?: string[];
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  rating: number;
  review_count: number;
  accepts_bookings: boolean;
  booking_note?: string;
  working_hours?: {
    [key: string]: { start: string; end: string; is_working: boolean };
  };
  breaks?: Array<{
    id: number;
    title: string;
    type: 'daily' | 'weekly' | 'specific_date' | 'date_range';
    start_time: string;
    end_time: string;
    days?: string[];
    date?: string;
    start_date?: string;
    end_date?: string;
    is_active: boolean;
    created_at: string;
  }>;
  vacations?: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    type: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
  }>;
  salon: {
    id: number;
    name: string;
    slug: string;
    address: string;
    city: string;
    phone: string;
    image_url?: string;
    working_hours?: {
      [key: string]: { open: string; close: string; is_open: boolean };
    };
    salon_breaks?: Array<{
      id: number;
      title: string;
      type: 'daily' | 'weekly' | 'specific_date' | 'date_range';
      start_time: string;
      end_time: string;
      days?: string[];
      date?: string;
      start_date?: string;
      end_date?: string;
      is_active: boolean;
      created_at: string;
    }>;
    salon_vacations?: Array<{
      id: number;
      title: string;
      start_date: string;
      end_date: string;
      type: string;
      notes?: string;
      is_active: boolean;
      created_at: string;
    }>;
  };
  services: Array<{
    id: number;
    name: string;
    description?: string;
    duration: number;
    price: number;
    discount_price?: number;
    category: string;
    images?: Array<{
      id: number;
      image_url: string;
      title?: string;
      description?: string;
      is_featured: boolean;
    }>;
  }>;
  portfolio?: Array<{
    id: number;
    image_url: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    is_featured: boolean;
  }>;
}

interface Review {
  id: number;
  client_name: string;
  rating: number;
  comment: string;
  date: string;
}

// Service Gallery Component with Slider
const ServiceGallery: React.FC<{ 
  images?: Array<{
    id: number;
    image_url: string;
    title?: string;
    description?: string;
    is_featured: boolean;
    order?: number;
  }> 
}> = ({ images }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  // Add default order if missing
  const imagesWithOrder = images.map((img, index) => ({
    ...img,
    order: img.order ?? index
  }));

  return (
    <>
      <ServiceGallerySlider
        images={imagesWithOrder}
        onImageClick={(index) => setSelectedImageIndex(index)}
      />

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <Lightbox
          images={imagesWithOrder}
          currentIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onNext={() => setSelectedImageIndex((selectedImageIndex + 1) % imagesWithOrder.length)}
          onPrev={() => setSelectedImageIndex((selectedImageIndex - 1 + imagesWithOrder.length) % imagesWithOrder.length)}
        />
      )}
    </>
  );
};

export const StaffProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | undefined>();

  useEffect(() => {
    const fetchStaffProfile = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${API_URL}/public/staff/${slug}`);
        
        if (!response.ok) {
          throw new Error('Staff not found');
        }
        
        const data = await response.json();
        setStaff(data.staff);

        // Fetch reviews
        const reviewsResponse = await fetch(`${API_URL}/public/staff/${slug}/reviews`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.reviews || []);
        }
      } catch (error) {
        console.error('Error fetching staff profile:', error);
        navigate('/pretraga');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchStaffProfile();
    }
  }, [slug, navigate]);

  const openBookingModal = (serviceId?: number) => {
    setSelectedServiceId(serviceId);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedServiceId(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!staff) {
    return null;
  }

  const profileImage = staff.profile_image || staff.avatar;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image & Quick Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-24">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={staff.name}
                    className="w-full h-80 object-cover"
                  />
                ) : (
                  <div className="w-full h-80 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <span className="text-6xl font-bold text-pink-600">
                      {staff.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{staff.name}</h1>
                  {staff.title && (
                    <p className="text-lg text-pink-600 font-medium mb-3">{staff.title}</p>
                  )}
                  <p className="text-gray-600 mb-4">{staff.role}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        i < Math.floor(staff.rating) ? (
                          <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                        ) : (
                          <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                        )
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {staff.rating.toFixed(1)} ({staff.review_count} recenzija)
                    </span>
                  </div>

                  {/* Experience */}
                  {staff.years_experience && (
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <CheckBadgeIcon className="h-5 w-5 text-pink-600" />
                      <span>{staff.years_experience} godina iskustva</span>
                    </div>
                  )}

                  {/* Languages */}
                  {staff.languages && staff.languages.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-700 mb-6">
                      <LanguageIcon className="h-5 w-5 text-pink-600" />
                      <span>{staff.languages.join(', ')}</span>
                    </div>
                  )}

                  {/* Booking Button */}
                  {staff.accepts_bookings && (
                    <button
                      onClick={() => openBookingModal()}
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
                      Rezerviši termin
                    </button>
                  )}

                  {staff.booking_note && (
                    <p className="text-sm text-gray-600 mt-3 text-center italic">
                      {staff.booking_note}
                    </p>
                  )}

                  {/* Social Media */}
                  {(staff.instagram || staff.facebook || staff.tiktok) && (
                    <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
                      {staff.instagram && (
                        <a
                          href={staff.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                      )}
                      {staff.facebook && (
                        <a
                          href={staff.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                      )}
                      {staff.tiktok && (
                        <a
                          href={staff.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 hover:text-gray-700"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Salon Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Radi u salonu</h3>
                <Link
                  to={`/salon/${staff.salon.slug}`}
                  className="flex items-start gap-4 hover:bg-gray-50 p-4 rounded-xl transition-colors"
                >
                  {staff.salon.image_url && (
                    <img
                      src={staff.salon.image_url}
                      alt={staff.salon.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{staff.salon.name}</h4>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{staff.salon.address}, {staff.salon.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{staff.salon.phone}</span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('about')}
                      className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                        activeTab === 'about'
                          ? 'border-b-2 border-pink-600 text-pink-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      O meni
                    </button>
                    {staff.portfolio && staff.portfolio.length > 0 && (
                      <button
                        onClick={() => setActiveTab('portfolio')}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                          activeTab === 'portfolio'
                            ? 'border-b-2 border-pink-600 text-pink-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <PhotoIcon className="h-5 w-5 inline mr-2" />
                        Portfolio ({staff.portfolio.length})
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                        activeTab === 'reviews'
                          ? 'border-b-2 border-pink-600 text-pink-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <StarIcon className="h-5 w-5 inline mr-2" />
                      Recenzije ({staff.review_count})
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* About Tab */}
                  {activeTab === 'about' && (
                    <div className="space-y-8">
                      {/* Bio */}
                      {(staff.bio_long || staff.bio) && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">O meni</h3>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {staff.bio_long || staff.bio}
                          </p>
                        </div>
                      )}

                      {/* Specialties */}
                      {staff.specialties && staff.specialties.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Specijalnosti</h3>
                          <div className="flex flex-wrap gap-2">
                            {staff.specialties.map((specialty, index) => (
                              <span
                                key={index}
                                className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-medium"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {staff.education && staff.education.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <AcademicCapIcon className="h-6 w-6 text-pink-600" />
                            Obrazovanje i certifikati
                          </h3>
                          <div className="space-y-4">
                            {staff.education.map((edu, index) => (
                              <div key={index} className="border-l-4 border-pink-600 pl-4">
                                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                <p className="text-gray-600">{edu.school}</p>
                                <p className="text-sm text-gray-500">{edu.year}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Achievements */}
                      {staff.achievements && staff.achievements.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrophyIcon className="h-6 w-6 text-pink-600" />
                            Postignuća i nagrade
                          </h3>
                          <div className="space-y-4">
                            {staff.achievements.map((achievement, index) => (
                              <div key={index} className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl">
                                <h4 className="font-semibold text-gray-900 mb-1">{achievement.title}</h4>
                                <p className="text-gray-700 mb-2">{achievement.description}</p>
                                <p className="text-sm text-gray-500">{achievement.year}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services */}
                      {staff.services && staff.services.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Usluge</h3>
                          <div className="space-y-6">
                            {staff.services.map((service) => (
                              <div key={service.id} className="border border-gray-200 rounded-xl p-6 hover:border-pink-300 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg text-gray-900">{service.name}</h4>
                                    {service.description && (
                                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    {service.discount_price ? (
                                      <>
                                        <span className="text-xl font-bold text-pink-600">
                                          {service.discount_price} KM
                                        </span>
                                        <span className="text-sm text-gray-400 line-through ml-2 block">
                                          {service.price} KM
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-xl font-bold text-pink-600">
                                        {service.price} KM
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3 text-sm text-gray-500">
                                    {service.duration > 0 && (
                                      <>
                                        <div className="flex items-center gap-1">
                                          <ClockIcon className="h-4 w-4" />
                                          <span>{service.duration} min</span>
                                        </div>
                                        <span className="text-gray-300">•</span>
                                      </>
                                    )}
                                    <span>{service.category}</span>
                                  </div>
                                  {staff.accepts_bookings && service.duration > 0 && (
                                    <button
                                      onClick={() => openBookingModal(service.id)}
                                      className="text-sm font-medium text-pink-600 hover:text-pink-700 transition-colors flex items-center gap-1"
                                    >
                                      <CalendarDaysIcon className="h-4 w-4" />
                                      Rezerviši
                                    </button>
                                  )}
                                </div>

                                {/* Service Gallery */}
                                <ServiceGallery images={service.images} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Portfolio Tab */}
                  {activeTab === 'portfolio' && staff.portfolio && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Galerija radova</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {staff.portfolio.map((item) => (
                          <div
                            key={item.id}
                            className="relative group cursor-pointer rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                            onClick={() => setSelectedImage(item.image_url)}
                          >
                            <img
                              src={item.image_url}
                              alt={item.title || 'Portfolio'}
                              className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {item.is_featured && (
                              <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
                                Istaknuto
                              </div>
                            )}
                            {item.title && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <h4 className="text-white font-semibold">{item.title}</h4>
                                {item.category && (
                                  <p className="text-white/80 text-sm">{item.category}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Recenzije klijenata</h3>
                      {reviews.length > 0 ? (
                        <div className="space-y-4">
                          {reviews.map((review) => (
                            <div key={review.id} className="border border-gray-200 rounded-xl p-6">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900">{review.client_name}</h4>
                                  <p className="text-sm text-gray-500">{review.date}</p>
                                </div>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    i < review.rating ? (
                                      <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                                    ) : (
                                      <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                                    )
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <StarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Još nema recenzija</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Portfolio"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Guest Booking Modal */}
      {showBookingModal && staff && (
        <GuestBookingModal
          isOpen={showBookingModal}
          onClose={closeBookingModal}
          salon={{
            id: staff.salon.id,
            name: staff.salon.name,
            slug: staff.salon.slug,
            working_hours: staff.salon.working_hours,
            salon_breaks: (staff.salon.salon_breaks || []).map(b => ({ ...b, id: b.id.toString() })),
            salon_vacations: (staff.salon.salon_vacations || []).map(v => ({ ...v, id: v.id.toString(), type: v.type as 'vacation' | 'sick_leave' | 'personal' | 'other' })),
          }}
          services={staff.services.map(service => ({
            ...service,
            id: service.id.toString(),
            description: service.description || '',
            salon_id: staff.salon.id.toString(),
            staff_ids: [staff.id.toString()],
            is_active: true,
            created_at: '',
            updated_at: '',
            images: service.images?.map((img, idx) => ({
              ...img,
              order: idx
            })),
          }))}
          staff={[{
            id: staff.id.toString(),
            name: staff.name,
            role: staff.role,
            avatar: staff.avatar,
            avatar_url: staff.profile_image || staff.avatar,
            bio: staff.bio,
            specialties: staff.specialties || [],
            working_hours: staff.working_hours || {},
            breaks: (staff.breaks || []).map(b => ({ ...b, id: b.id.toString() })),
            vacations: (staff.vacations || []).map(v => ({ ...v, id: v.id.toString(), type: v.type as 'vacation' | 'sick_leave' | 'personal' | 'other' })),
            rating: staff.rating,
            review_count: staff.review_count,
            salon_id: staff.salon.id.toString(),
            is_active: true,
            created_at: '',
            updated_at: '',
          }]}
          preselectedStaff={{
            id: staff.id.toString(),
            name: staff.name,
            role: staff.role,
            avatar: staff.avatar,
            avatar_url: staff.profile_image || staff.avatar,
            bio: staff.bio,
            specialties: staff.specialties || [],
            working_hours: {},
            breaks: [],
            vacations: [],
            rating: staff.rating,
            review_count: staff.review_count,
            salon_id: staff.salon.id.toString(),
            is_active: true,
            created_at: '',
            updated_at: '',
          }}
          preselectedService={selectedServiceId ? (() => {
            const service = staff.services.find(s => s.id === selectedServiceId);
            return service ? {
              ...service,
              id: selectedServiceId.toString(),
              description: service.description || '',
              salon_id: staff.salon.id.toString(),
              staff_ids: [staff.id.toString()],
              is_active: true,
              created_at: '',
              updated_at: '',
              images: service.images?.map((img, idx) => ({
                ...img,
                order: idx
              })),
            } : undefined;
          })() : undefined}
        />
      )}

      <PublicFooter />
    </div>
  );
};
