import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Phone, Mail, Star, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ReviewModal } from './ReviewModal';
import { ConfirmModal } from './ConfirmModal';
import { appointmentAPI, reviewAPI } from '../../services/api';

export function ClientAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  useEffect(() => {
    loadAppointments();
    
    // Check if we came from booking completion
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('booking') === 'success') {
      setShowSuccess(true);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Listen for tab switch events (e.g., from notification click)
    const handleTabSwitch = (event: CustomEvent) => {
      if (event.detail === 'past' || event.detail === 'upcoming') {
        setActiveTab(event.detail);
      }
    };

    window.addEventListener('switchAppointmentTab', handleTabSwitch as EventListener);
    return () => {
      window.removeEventListener('switchAppointmentTab', handleTabSwitch as EventListener);
    };
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await appointmentAPI.getAppointments();
      setAppointments(response);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and sort appointments
  const upcomingAppointments = appointments
    .filter(app => ['confirmed', 'pending'].includes(app.status))
    .sort((a, b) => {
      // First sort by date
      const dateA = new Date(a.date.split('.').reverse().join('-'));
      const dateB = new Date(b.date.split('.').reverse().join('-'));
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If same date, sort by time
      return a.time.localeCompare(b.time);
    });
  
  const pastAppointments = appointments
    .filter(app => ['completed', 'cancelled'].includes(app.status))
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = new Date(a.date.split('.').reverse().join('-'));
      const dateB = new Date(b.date.split('.').reverse().join('-'));
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // If same date, sort by time
      return b.time.localeCompare(a.time);
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Potvrđen';
      case 'pending': return 'Na čekanju';
      case 'completed': return 'Završen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  const handleCancelAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await appointmentAPI.cancelAppointment(selectedAppointment.id);
      
      // Refresh appointments
      loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Došlo je do greške pri otkazivanju termina. Molimo pokušajte ponovo.');
    } finally {
      setShowCancelModal(false);
      setSelectedAppointment(null);
    }
  };

  const handleContactSalon = (appointment: any) => {
    const salonIdentifier = appointment.salon?.slug || appointment.salon?.id;
    navigate(`/salon/${salonIdentifier}`);
  };

  const handleLeaveReview = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh appointments to update review status
    loadAppointments();
  };

  const hasReview = async (appointmentId: string): Promise<boolean> => {
    try {
      // Check if appointment has a review
      const appointment = await appointmentAPI.getAppointment(appointmentId);
      return !!appointment.review;
    } catch (error) {
      console.error('Error checking review:', error);
      return false;
    }
  };

  // Format time to remove seconds (HH:MM:SS -> HH:MM)
  const formatTime = (time: string): string => {
    if (!time) return '';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const AppointmentCard = ({ appointment }: { appointment: any }) => {
    const [hasReviewState, setHasReviewState] = useState<boolean | null>(null);
    
    useEffect(() => {
      if (appointment.status === 'completed') {
        hasReview(appointment.id).then(setHasReviewState);
      }
    }, [appointment.id, appointment.status]);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{appointment.salon.name}</h3>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              <span>{appointment.salon.address}, {appointment.salon.city}</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)} mt-2 sm:mt-0`}>
            {getStatusText(appointment.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Datum:</span>
              <span>{appointment.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Vrijeme:</span>
              <span>{formatTime(appointment.time)} - {formatTime(appointment.end_time)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Frizer:</span>
              <span>{appointment.staff.name}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Usluga:</span>
              <span className="ml-2">
                {appointment.service_name || 
                 (appointment.services && appointment.services.length > 0 
                   ? appointment.services.map((s: any) => s.name).join(', ')
                   : appointment.service?.name || 'Nepoznata usluga')}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Cijena:</span>
              <span className="ml-2 font-semibold text-green-600">{appointment.total_price} KM</span>
            </div>
          </div>
        </div>

        {appointment.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600"><strong>Napomene:</strong> {appointment.notes}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {appointment.status === 'confirmed' && (
            <button 
              onClick={() => handleCancelAppointment(appointment)}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Otkaži termin
            </button>
          )}
          
          {appointment.status === 'pending' && (
            <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors text-sm">
              Čeka potvrdu salona
            </button>
          )}

          {appointment.status === 'completed' && hasReviewState === false && (
            <button 
              onClick={() => handleLeaveReview(appointment)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              Oceni uslugu
            </button>
          )}

          {appointment.status === 'completed' && hasReviewState === true && (
            <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Recenzija ostavljena
            </div>
          )}

          <button 
            onClick={() => handleContactSalon(appointment)}
            className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Kontakt salon
          </button>
        </div>
      </div>
    );
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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800">Termin uspješno zakazan!</h3>
            <p className="text-green-700 text-sm">Vaš novi termin je dodan u listu nadolazećih termina.</p>
          </div>
          <button 
            onClick={() => setShowSuccess(false)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Moji termini</h1>
        <button 
          onClick={() => navigate('/pretraga')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Rezerviši novi termin
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Nadolazeći ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'past'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Istorija ({pastAppointments.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nema nadolazećih termina</h3>
                  <p className="text-gray-600 mb-6">Rezervišite termin u vašem omiljenom salonu</p>
                  <button 
                    onClick={() => navigate('/pretraga')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Rezerviši termin
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div className="space-y-4">
              {pastAppointments.length > 0 ? (
                pastAppointments.map(appointment => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nema prethodnih termina</h3>
                  <p className="text-gray-600">Ovde će se prikazati vaši završeni termini</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedAppointment && (
        <ReviewModal
          salon={selectedAppointment.salon}
          appointmentId={selectedAppointment.id}
          staffId={selectedAppointment.staff_id}
          serviceId={selectedAppointment.service_id}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedAppointment(null);
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Otkazivanje termina"
        message="Da li ste sigurni da želite da otkažete ovaj termin? Ova akcija se ne može poništiti."
        confirmText="Da, otkaži"
        cancelText="Ne"
        type="danger"
        onConfirm={confirmCancelAppointment}
        onCancel={() => {
          setShowCancelModal(false);
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
}