import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Mail, 
  Globe,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Search
} from 'lucide-react';
import { Salon, Service, Staff, Review, StaffRole, StaffRoleLabels } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookingModal } from './BookingModal';
import { salonAPI, reviewAPI, favoriteAPI, staffAPI, serviceAPI } from '../../services/api';
import { LocationService } from '../../utils/locationUtils';

export function SalonPage() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (salonId) {
      loadSalonData();
      if (user) {
        checkFavoriteStatus();
      }
    }
  }, [salonId, user]);

  useEffect(() => {
    if (salon && salon.location.lat !== 0 && salon.location.lng !== 0 && window.google && !mapLoaded) {
      initializeMap();
    }
  }, [salon, mapLoaded]);

  const loadSalonData = async () => {
    try {
      setLoading(true);
      
      // Get salon details
      const salonData = await salonAPI.getSalon(salonId!);
      setSalon(salonData);
      
      // Get salon services
      const servicesData = await serviceAPI.getServices(salonId!);
      setServices(Array.isArray(servicesData) ? servicesData : (servicesData?.data || []));
      
      // Get salon staff
      const staffData = await staffAPI.getStaff(salonId!);
      setStaff(Array.isArray(staffData) ? staffData : (staffData?.data || []));
      
      // Get salon reviews
      const reviewsData = await reviewAPI.getSalonReviews(salonId!);
      setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData?.data || []));
      
    } catch (error) {
      console.error('Error loading salon data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { is_favorite } = await favoriteAPI.checkFavorite(salonId!);
      setIsFavorite(is_favorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const initializeMap = () => {
    if (!salon || salon.location.lat === 0 || !window.google) return;

    const mapElement = document.getElementById(`salon-map-${salon.id}`);
    if (!mapElement) return;

    const map = new google.maps.Map(mapElement, {
      zoom: 16,
      center: { lat: salon.location.lat, lng: salon.location.lng },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    new google.maps.Marker({
      position: { lat: salon.location.lat, lng: salon.location.lng },
      map: map,
      title: salon.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 40 16 40S32 24.837 32 16C32 7.163 24.837 0 16 0Z" fill="#DC2626"/>
            <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
            <path d="M16 10L18.5 15H22L19 18L20 23L16 20L12 23L13 18L10 15H13.5L16 10Z" fill="#DC2626"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40)
      }
    });

    setMapLoaded(true);
  };

  const toggleFavorite = async () => {
    if (!user || !salon) return;

    try {
      if (isFavorite) {
        await favoriteAPI.removeFavorite(salon.id);
        setIsFavorite(false);
      } else {
        await favoriteAPI.addFavorite(salon.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const categories = ['all', ...new Set(services.map(s => s.category))];
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const nextImage = () => {
    if (salon?.images.length) {
      setCurrentImageIndex((prev) => (prev + 1) % salon.images.length);
    }
  };

  const prevImage = () => {
    if (salon?.images.length) {
      setCurrentImageIndex((prev) => (prev - 1 + salon.images.length) % salon.images.length);
    }
  };

  const handleBookService = (service?: Service) => {
    if (!user) {
      alert('Morate biti prijavljeni da biste rezervisali termin');
      return;
    }
    setSelectedService(service || null);
    setShowBookingModal(true);
  };

  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      monday: 'Ponedjeljak',
      tuesday: 'Utorak',
      wednesday: 'Srijeda',
      thursday: 'Četvrtak',
      friday: 'Petak',
      saturday: 'Subota',
      sunday: 'Nedjelja'
    };
    return days[day] || day;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje salona...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salon nije pronađen</h2>
          <button 
            onClick={() => navigate('/')}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Povratak na početnu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate px-4">{salon.name}</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleFavorite}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Share2 className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Image Gallery */}
        <div className="relative">
          <div className="aspect-[4/3] sm:aspect-video bg-gray-100">
            {salon.images && salon.images.length > 0 ? (
              <img
                src={salon.images[currentImageIndex].url}
                alt={salon.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500">Nema slika</span>
              </div>
            )}
            
            {salon.images && salon.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {salon.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Location Map */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokacija</h3>
          
          {salon.location.lat !== 0 && salon.location.lng !== 0 ? (
            <div className="space-y-4">
              <div 
                id={`salon-map-${salon.id}`}
                className="w-full h-64 rounded-lg border border-gray-200"
                style={{ minHeight: '256px' }}
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${salon.location.lat},${salon.location.lng}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Vodi me do salona
                </button>
                
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.name + ' ' + salon.address + ' ' + salon.city)}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Pretraži na mapi
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>Lokacija nije dostupna</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{salon.name}</h1>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">{salon.rating}</span>
                  <span className="text-gray-600">({salon.review_count} recenzija)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{salon.address}, {salon.city}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleBookService()}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold text-center shadow-lg"
              >
                Rezerviši termin
              </button>
            </div>
            
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{salon.description}</p>
          </div>

          {/* Target Audience */}
          {salon.target_audience && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Salon za:</span>
              <div className="flex gap-1">
                {salon.target_audience.women && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Žene</span>
                )}
                {salon.target_audience.men && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Muškarce</span>
                )}
                {salon.target_audience.children && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Djecu</span>
                )}
              </div>
            </div>
          )}

          {/* Services */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Usluge</h2>
            
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'Sve usluge' : category}
                </button>
              ))}
            </div>

            {/* Services List */}
            <div className="space-y-4">
              {filteredServices.map(service => (
                <div key={service.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-orange-300 transition-colors shadow-sm">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                        {service.discount_price ? (
                          <div className="flex items-center gap-2">
                            <span className="line-through text-gray-400">{service.price} KM</span>
                            <span className="text-lg font-bold text-red-600">{service.discount_price} KM</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-orange-600">{service.price} KM</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleBookService(service)}
                      className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors font-semibold"
                    >
                      Rezerviši - {service.discount_price || service.price} KM
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff */}
          {staff.length > 0 && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Naš tim</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {staff.map(member => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{StaffRoleLabels[member.role as StaffRole] || member.role}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs font-medium">{member.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {member.specialties.slice(0, 3).map((specialty, index) => (
                        <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {specialty}
                        </span>
                      ))}
                      {member.specialties.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{member.specialties.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${salon.phone}`} className="text-orange-600 hover:text-orange-700 font-medium">
                    {salon.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${salon.email}`} className="text-orange-600 hover:text-orange-700 font-medium break-all">
                    {salon.email}
                  </a>
                </div>
                {salon.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a href={salon.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 font-medium">
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Radno vrijeme</h3>
              <div className="space-y-2">
                {Object.entries(salon.working_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">{getDayName(day)}:</span>
                    <span className={hours.is_open ? 'text-gray-900 font-medium' : 'text-red-600'}>
                      {hours.is_open ? `${hours.open} - ${hours.close}` : 'Zatvoreno'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Vacation/Break Notice */}
          {salon.salon_vacations && salon.salon_vacations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Trenutni neradni periodi:</h4>
              <div className="space-y-1">
                {salon.salon_vacations
                  .filter(vacation => vacation.is_active)
                  .map((vacation, index) => (
                    <div key={index} className="text-sm text-yellow-700">
                      <strong>{vacation.title}:</strong> {vacation.start_date} - {vacation.end_date}
                      {vacation.notes && <span className="ml-2">({vacation.notes})</span>}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {salon.amenities && salon.amenities.length > 0 && (
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pogodnosti</h3>
              <div className="flex flex-wrap gap-2">
                {salon.amenities.map((amenity, index) => (
                  <span key={index} className="px-3 py-2 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recenzije ({reviews.length})</h3>
              {user && (
                <button
                  onClick={() => {
                    // Check if user has completed appointment at this salon
                    // This would be handled by the backend in a real implementation
                    setSelectedService(null);
                    setShowBookingModal(true);
                  }}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  Ostavi recenziju
                </button>
              )}
            </div>
            
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{review.client_name}</h4>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
                    <p className="text-xs text-gray-500">{review.date}</p>
                    
                    {review.response && (
                      <div className="mt-3 ml-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-blue-800">{review.response.respondedBy}</span>
                          <span className="text-xs text-blue-600">{review.response.date}</span>
                        </div>
                        <p className="text-sm text-blue-700">{review.response.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nema recenzija za ovaj salon</p>
                <p className="text-gray-400 text-sm">Budite prvi koji će ostaviti recenziju!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && salon && (
        <BookingModal
          salon={salon}
          selectedService={selectedService}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
}