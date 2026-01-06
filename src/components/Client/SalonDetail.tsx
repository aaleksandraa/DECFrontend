import React, { useState, useEffect } from 'react';
import { 
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
  X
} from 'lucide-react';
import { Salon, Service, Staff, Review } from '../../types';
import { db } from '../../services/database';
import { useAuth } from '../../context/AuthContext';

interface SalonDetailProps {
  salon: Salon;
  onClose: () => void;
  onBookAppointment: (salon: Salon, service?: Service) => void;
}

export function SalonDetail({ salon, onClose, onBookAppointment }: SalonDetailProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadSalonData();
  }, [salon.id]);

  const loadSalonData = () => {
    try {
      const salonServices = db.getServicesBySalonId(salon.id);
      const salonStaff = db.getStaffBySalonId(salon.id);
      const salonReviews = db.getReviewsBySalonId(salon.id);
      
      setServices(salonServices);
      setStaff(salonStaff);
      setReviews(salonReviews);
    } catch (error) {
      console.error('Error loading salon data:', error);
    }
  };

  const categories = ['all', ...new Set(services.map(s => s.category))];
  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % salon.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + salon.images.length) % salon.images.length);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate pr-4">{salon.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Image Gallery */}
          <div className="relative">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
              <img
                src={salon.images[currentImageIndex]}
                alt={salon.name}
                className="w-full h-full object-cover"
              />
              {salon.images.length > 1 && (
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-semibold">{salon.rating}</span>
                    <span className="text-gray-600">({salon.reviewCount} recenzija)</span>
                  </div>
                  <button
                    onClick={() => onBookAppointment(salon)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium w-full sm:w-auto text-center"
                  >
                    Rezerviši termin
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{salon.address}, {salon.city}</span>
                </div>
                
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{salon.description}</p>
              </div>

              {/* Target Audience */}
              {salon.targetAudience && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Salon za:</span>
                  <div className="flex gap-1">
                    {salon.targetAudience.women && (
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Žene</span>
                    )}
                    {salon.targetAudience.men && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Muškarce</span>
                    )}
                    {salon.targetAudience.children && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Djecu</span>
                    )}
                  </div>
                </div>
              )}

              {/* Services */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Usluge</h3>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-orange-500 text-white'
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
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{service.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{service.duration} min</span>
                            </div>
                            {service.discount_price ? (
                              <div className="flex items-center gap-2">
                                <span className="line-through text-gray-400">{service.price} KM</span>
                                <span className="font-semibold text-red-600">{service.discount_price} KM</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-orange-600">{service.price} KM</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onBookAppointment(salon, service)}
                          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium w-full sm:w-auto"
                        >
                          Rezerviši
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff */}
              {staff.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Naš tim</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {staff.map(member => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{member.name}</h4>
                            <p className="text-sm text-gray-600 truncate">{member.role}</p>
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Recenzije</h3>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map(review => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{review.clientName}</h4>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-2">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontakt informacije</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${salon.phone}`} className="text-orange-600 hover:text-orange-700 text-sm sm:text-base">
                      {salon.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <a href={`mailto:${salon.email}`} className="text-orange-600 hover:text-orange-700 text-sm sm:text-base break-all">
                      {salon.email}
                    </a>
                  </div>
                  {salon.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <a href={salon.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 text-sm sm:text-base">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Radno vrijeme</h3>
                <div className="space-y-2">
                  {Object.entries(salon.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-gray-600">{getDayName(day)}:</span>
                      <span className={hours.isOpen ? 'text-gray-900' : 'text-red-600'}>
                        {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Zatvoreno'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {salon.amenities.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pogodnosti</h3>
                  <div className="flex flex-wrap gap-2">
                    {salon.amenities.map((amenity, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white text-center">
                <h3 className="text-lg font-semibold mb-2">Spremni za promjenu?</h3>
                <p className="text-orange-100 text-sm mb-4">Rezervišite termin već danas</p>
                <button
                  onClick={() => onBookAppointment(salon)}
                  className="w-full bg-white text-orange-600 py-3 px-4 rounded-lg hover:bg-orange-50 transition-colors font-medium"
                >
                  Rezerviši termin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}