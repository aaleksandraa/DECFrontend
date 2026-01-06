import { useState, useEffect } from 'react';
import { Calendar, Phone, Mail, Plus, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, serviceAPI, staffAPI } from '../../services/api';
import { formatDateEuropean, getCurrentDateEuropean, europeanToIsoDate } from '../../utils/dateUtils';
import { MultiServiceManualBookingModal } from '../Common/MultiServiceManualBookingModal';
import { ClientDetailsModal } from '../Common/ClientDetailsModal';

export function SalonAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDateEuropean());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientModal, setShowClientModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, selectedDate, selectedStatus, selectedStaff]);

  const loadData = async () => {
    if (!user?.salon) return;

    try {
      setLoading(true);
      
      // Load appointments with filters
      const params: any = {};
      if (selectedDate) {
        // Convert European date to ISO format for API
        params.date = europeanToIsoDate(selectedDate);
        console.log('Filter params:', { selectedDate, isoDate: params.date, selectedStatus, selectedStaff });
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      
      const appointmentsData = await appointmentAPI.getAppointments(params);
      console.log('API Response:', appointmentsData);
      
      // Ensure we have an array
      const appointmentsArray = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.data || []);
      console.log('Appointments array:', appointmentsArray.length, 'items');
      
      // Filter by salon and staff if needed
      let filteredAppointments = appointmentsArray.filter((app: any) => 
        String(app.salon_id) === String(user.salon?.id) || String(app.salon?.id) === String(user.salon?.id)
      );
      console.log('After salon filter:', filteredAppointments.length, 'items');
      
      if (selectedStaff !== 'all') {
        filteredAppointments = filteredAppointments.filter((app: any) => String(app.staff_id) === String(selectedStaff));
        console.log('After staff filter:', filteredAppointments.length, 'items');
      }
      
      setAppointments(filteredAppointments);
      
      // Load services and staff
      const servicesData = await serviceAPI.getServices(user.salon.id);
      const staffData = await staffAPI.getStaff(user.salon.id);
      
      // Handle paginated or array response
      setServices(Array.isArray(servicesData) ? servicesData : (servicesData?.data || []));
      setStaff(Array.isArray(staffData) ? staffData : (staffData?.data || []));
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAppointmentAction = async (appointmentId: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      const newStatus = action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : 'completed';
      await appointmentAPI.updateAppointment(appointmentId, { status: newStatus });
      
      // Refresh appointments
      loadData();
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleContactClient = (appointment: any) => {
    const phone = appointment.client_phone;
    const message = `Poštovani ${appointment.client_name}, kontaktiramo Vas u vezi termina zakazanog za ${appointment.date} u ${appointment.time}h.`;
    
    // Show options
    const choice = window.confirm(`Kako želite kontaktirati klijenta?\n\nOK = Poziv\nCancel = SMS/WhatsApp`);
    
    if (choice) {
      // Call
      window.location.href = `tel:${phone}`;
    } else {
      // SMS/WhatsApp - try WhatsApp first
      const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Nepoznata usluga';
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || 'Nepoznat zaposleni';
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
        <h1 className="text-2xl font-bold text-gray-900">Upravljanje terminima</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Dodaj termin
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
            <input
              type="date"
              value={europeanToIsoDate(selectedDate)}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(formatDateEuropean(new Date(e.target.value)));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Svi statusi</option>
              <option value="pending">Na čekanju</option>
              <option value="confirmed">Potvrđeni</option>
              <option value="completed">Završeni</option>
              <option value="cancelled">Otkazani</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zaposleni</label>
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
                setSelectedDate(getCurrentDateEuropean());
                setSelectedStatus('all');
                setSelectedStaff('all');
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Resetuj filtere
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Termini za {selectedDate}
          </h3>
          <p className="text-sm text-gray-600">{appointments.length} termina</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {appointments.length > 0 ? (
            appointments.map(appointment => (
              <div key={appointment.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                {/* Mobile-optimized layout */}
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Time and Status - Mobile: Row, Desktop: Column */}
                  <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-1 md:min-w-[100px]">
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold text-gray-900">{appointment.time}</div>
                      <div className="text-xs text-gray-500">{appointment.service?.duration}min</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                  
                  {/* Main Content */}
                  <div className="flex-1 space-y-3">
                    {/* Client Name - Clickable */}
                    <div>
                      <button
                        onClick={() => {
                          setSelectedClient({
                            id: appointment.client_id ? String(appointment.client_id) : undefined,
                            name: appointment.client_name,
                            phone: appointment.client_phone,
                            email: appointment.client_email
                          });
                          setShowClientModal(true);
                        }}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                      >
                        {appointment.client_name}
                      </button>
                      <p className="text-sm text-gray-600">{getServiceName(appointment.service_id)}</p>
                      <p className="text-xs md:text-sm text-gray-500">sa {getStaffName(appointment.staff_id)}</p>
                    </div>
                    
                    {/* Contact Info - Mobile: Stacked, Desktop: Grid */}
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                      {appointment.client_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <a 
                            href={`tel:${appointment.client_phone}`}
                            className="truncate text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {appointment.client_phone}
                          </a>
                        </div>
                      )}
                      {appointment.client_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{appointment.client_email}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Price */}
                    <div className="text-sm md:text-base font-medium text-gray-900">
                      Cijena: {appointment.total_price} KM
                    </div>
                    
                    {/* Notes */}
                    {appointment.notes && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600"><strong>Napomene:</strong> {appointment.notes}</p>
                      </div>
                    )}
                    
                    {/* Action Buttons - Mobile: Full width, Desktop: Inline */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 pt-2">
                      {appointment.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleAppointmentAction(appointment.id, 'confirm')}
                            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Potvrdi
                          </button>
                          <button 
                            onClick={() => handleAppointmentAction(appointment.id, 'cancel')}
                            className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Odbaci
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <button 
                          onClick={() => handleAppointmentAction(appointment.id, 'complete')}
                          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Označi kao završen
                        </button>
                      )}
                      
                      {appointment.status === 'cancelled' && (
                        <div className="text-sm text-gray-500 italic py-2">
                          Termin je otkazan
                        </div>
                      )}
                      
                      {/* Completed appointments - No edit button, moved to bottom */}
                      {appointment.status === 'completed' && (
                        <div className="w-full text-sm text-gray-500 italic py-2 border-t pt-3 mt-2">
                          ✓ Termin je završen
                        </div>
                      )}
                      
                      {/* Contact button for non-completed */}
                      {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleContactClient(appointment)}
                          className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          Kontaktiraj klijenta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nema termina</h3>
              <p className="text-gray-600 mb-6">Za izabrani datum nema zakazanih termina</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Dodaj termin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Booking Modal */}
      {user?.salon && (
        <MultiServiceManualBookingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          salonId={Number(user.salon.id)}
          preselectedDate={selectedDate}
        />
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <ClientDetailsModal
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false);
            setSelectedClient(null);
          }}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          clientPhone={selectedClient.phone}
          clientEmail={selectedClient.email}
        />
      )}


    </div>
  );
}