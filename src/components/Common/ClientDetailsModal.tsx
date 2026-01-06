import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, Clock, Scissors } from 'lucide-react';
import { appointmentAPI } from '../../services/api';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
}

export function ClientDetailsModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientPhone,
  clientEmail
}: ClientDetailsModalProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && (clientId || clientName)) {
      loadClientAppointments();
    }
  }, [isOpen, clientId, clientName]);

  const loadClientAppointments = async () => {
    if (!clientId && !clientName) return;
    
    try {
      setLoading(true);
      // Load appointments - API automatically filters by user role:
      // - Salon owners see only their salon's appointments
      // - Staff members see only their own appointments
      // - Clients see only their own appointments
      // This ensures data security at the backend level
      const response = await appointmentAPI.getAppointments();
      const allAppointments = Array.isArray(response) ? response : (response?.data || []);
      
      // Filter appointments for this specific client from the already-filtered results
      const clientAppointments = allAppointments
        .filter((app: any) => {
          // Try to match by ID (convert both to string for comparison)
          if (clientId && app.client_id) {
            return String(app.client_id) === String(clientId);
          }
          // Fallback: match by name (case insensitive) for manually added appointments
          if (clientName && app.client_name) {
            return app.client_name.toLowerCase() === clientName.toLowerCase();
          }
          return false;
        })
        .sort((a: any, b: any) => {
          // Sort by date descending (newest first)
          // Convert European date format (DD.MM.YYYY) to Date object for proper comparison
          const dateA = new Date(a.date.split('.').reverse().join('-'));
          const dateB = new Date(b.date.split('.').reverse().join('-'));
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // Descending (newest first)
          }
          
          // If same date, sort by time descending
          return b.time.localeCompare(a.time);
        });
      
      setAppointments(clientAppointments);
    } catch (error) {
      console.error('Error loading client appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Završeno';
      case 'in_progress': return 'U toku';
      case 'confirmed': return 'Potvrđen';
      case 'pending': return 'Na čekanju';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{clientName}</h2>
              <p className="text-blue-100 text-sm">Detalji klijenta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Kontakt informacije
            </h3>
            <div className="space-y-2">
              {clientPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-green-600" />
                  <a 
                    href={`tel:${clientPhone}`}
                    className="text-green-600 hover:text-green-800 font-medium hover:underline"
                  >
                    {clientPhone}
                  </a>
                </div>
              )}
              {clientEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <a 
                    href={`mailto:${clientEmail}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {clientEmail}
                  </a>
                </div>
              )}
              {!clientPhone && !clientEmail && (
                <p className="text-sm text-gray-500">Nema dostupnih kontakt informacija</p>
              )}
            </div>
          </div>

          {/* Appointments History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Istorija termina ({appointments.length})
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Učitavanje termina...</p>
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{appointment.date}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{appointment.time}</span>
                        {appointment.end_time && (
                          <>
                            <span>-</span>
                            <span>{appointment.end_time}</span>
                          </>
                        )}
                      </div>

                      {(appointment.service_name || appointment.service?.name) && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Scissors className="w-4 h-4 text-purple-500" />
                          <span>{appointment.service_name || appointment.service?.name}</span>
                        </div>
                      )}

                      {(appointment.staff_name || appointment.staff?.name) && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-orange-500" />
                          <span>{appointment.staff_name || appointment.staff?.name}</span>
                        </div>
                      )}

                      {appointment.total_price && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{appointment.total_price} KM</span>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          <strong>Napomena:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Nema prethodnih termina</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
