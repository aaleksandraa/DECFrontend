import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, User, Reply } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reviewAPI, staffAPI } from '../../services/api';

export function SalonReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, selectedRating, selectedStaff]);

  const loadData = async () => {
    if (!user?.salon) return;

    try {
      setLoading(true);
      
      // Load reviews with filters
      const params: any = {};
      if (selectedRating !== 'all') {
        params.rating = selectedRating;
      }
      if (selectedStaff !== 'all') {
        params.staff_id = selectedStaff;
      }
      
      const [reviewsData, staffData] = await Promise.all([
        reviewAPI.getSalonReviews(user.salon.id, params),
        staffAPI.getStaff(user.salon.id)
      ]);
      
      // Handle paginated or array responses
      setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData?.data || []));
      setStaff(Array.isArray(staffData) ? staffData : (staffData?.data || []));
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    stars: rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 : 0
  }));

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || 'Nepoznato';
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    return [...Array(5)].map((_, index) => (
      <Star 
        key={index} 
        className={`${size} ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleAddResponse = async (reviewId: string, responseText: string) => {
    try {
      await reviewAPI.addResponse(reviewId, responseText);
      loadData(); // Refresh reviews
    } catch (error) {
      console.error('Error adding response:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recenzije i ocene</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Izvezi recenzije
        </button>
      </div>

      {/* Rating Overview */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="mb-4">
              <h3 className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</h3>
              <div className="flex items-center justify-center gap-1 mt-2">
                {renderStars(Math.round(averageRating), 'w-6 h-6')}
              </div>
              <p className="text-gray-600 mt-2">Na osnovu {reviews.length} recenzija</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Distribucija ocena</h4>
            <div className="space-y-3">
              {ratingDistribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{stars} ⭐</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtriranje po oceni</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Sve ocene</option>
              <option value="5">5 ⭐</option>
              <option value="4">4 ⭐</option>
              <option value="3">3 ⭐</option>
              <option value="2">2 ⭐</option>
              <option value="1">1 ⭐</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtriranje po zaposlenom</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Svi zaposleni</option>
              {staff.map(staffMember => (
                <option key={staffMember.id} value={staffMember.id}>{staffMember.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={() => {
                setSelectedRating('all');
                setSelectedStaff('all');
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Resetuj filtere
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recenzije ({reviews.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{review.client_name}</h4>
                      <p className="text-sm text-gray-600">
                        za {getStaffName(review.staff_id || '')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {review.date}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{review.comment}</p>
                
                {review.response ? (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-800">{review.response.respondedBy}</span>
                      <span className="text-xs text-blue-600">{review.response.date}</span>
                    </div>
                    <p className="text-sm text-blue-700">{review.response.text}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const response = prompt('Unesite odgovor na recenziju:');
                        if (response) {
                          handleAddResponse(review.id, response);
                        }
                      }}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Reply className="w-4 h-4" />
                      Odgovori
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm">
                      <MessageSquare className="w-4 h-4" />
                      Kontaktiraj klijenta
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nema recenzija</h3>
              <p className="text-gray-600">Za izabrane filtere nema pronađenih recenzija</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}