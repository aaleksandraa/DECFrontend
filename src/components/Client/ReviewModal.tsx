import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Salon } from '../../types';
import { reviewAPI, serviceAPI, staffAPI } from '../../services/api';

interface ReviewModalProps {
  salon: Salon;
  appointmentId: string;
  staffId?: string;
  serviceId?: string;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export function ReviewModal({ 
  salon, 
  appointmentId, 
  staffId, 
  serviceId, 
  onClose, 
  onReviewSubmitted 
}: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [staff, setStaff] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (staffId) {
          const staffData = await staffAPI.getStaffMember(salon.id, staffId);
          setStaff(staffData);
        }
        
        if (serviceId) {
          const serviceData = await serviceAPI.getService(salon.id, serviceId);
          setService(serviceData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [salon.id, staffId, serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      await reviewAPI.createReview({
        appointment_id: appointmentId,
        rating,
        comment: comment.trim()
      });

      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Došlo je do greške pri slanju recenzije. Molimo pokušajte ponovo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Ostavite recenziju</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Salon Info */}
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">{salon.name}</h3>
              {staff && <p className="text-sm text-gray-600">Frizer: {staff.name}</p>}
              {service && <p className="text-sm text-gray-600">Usluga: {service.name}</p>}
            </div>

            {/* Rating */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Ocjena *
              </label>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-colors"
                  >
                    <Star 
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {rating === 0 && 'Kliknite na zvjezdice za ocjenu'}
                {rating === 1 && 'Vrlo loše'}
                {rating === 2 && 'Loše'}
                {rating === 3 && 'Prosječno'}
                {rating === 4 && 'Dobro'}
                {rating === 5 && 'Odlično'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Komentar
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="Podijelite svoje iskustvo sa ostalim klijentima..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 karaktera
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Otkaži
              </button>
              <button
                type="submit"
                disabled={rating === 0 || submitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? 'Šalje se...' : 'Pošalji recenziju'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}