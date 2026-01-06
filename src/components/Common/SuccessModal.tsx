import React from 'react';
import { X, Calendar, Download, Mail, CheckCircle } from 'lucide-react';
import { publicAPI } from '../../services/api';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: number;
    date: string;
    time: string;
    end_time: string;
    service_name?: string;
    staff_name?: string;
    service?: {
      id: number;
      name: string;
      duration: number;
      price: number;
    };
    services?: Array<{
      id: number;
      name: string;
      duration: number;
      price: number;
    }>;
    is_multi_service?: boolean;
    salon?: {
      id: number;
      name: string;
      address?: string;
      city?: string;
      phone?: string;
    };
    staff?: {
      id: number;
      name: string;
      role?: string;
    };
    total_price: number;
    client_email?: string;
  };
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, appointment }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  if (!isOpen) return null;

  // Safe access to nested properties - try both flat and nested structure
  const staffName = appointment?.staff_name || appointment?.staff?.name || 'N/A';
  const salonName = appointment?.salon?.name || 'N/A';
  const salonAddress = appointment?.salon?.address;
  const salonCity = appointment?.salon?.city;

  // Handle multi-service appointments
  const isMultiService = appointment?.is_multi_service || (appointment?.services && appointment.services.length > 1);
  const services = appointment?.services || (appointment?.service ? [appointment.service] : []);
  const serviceName = appointment?.service_name || services.map(s => s.name).join(', ') || 'N/A';
  
  // Calculate total duration
  const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Format time to remove seconds if present (HH:MM:SS -> HH:MM)
  const formatTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
  };

  const handleDownloadIcs = async () => {
    setIsDownloading(true);
    try {
      const blob = await publicAPI.downloadIcs(appointment.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `termin-${appointment.id}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ICS file:', error);
      alert('Greška pri preuzimanju kalendar fajla. Molimo pokušajte ponovo.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Format date for display (DD.MM.YYYY)
  const formatDate = (dateStr: string) => {
    // Handle both YYYY-MM-DD and DD.MM.YYYY formats
    if (!dateStr) return 'Invalid Date';
    
    // If already in DD.MM.YYYY format, return as is
    if (dateStr.includes('.')) {
      return dateStr;
    }
    
    // Convert YYYY-MM-DD to DD.MM.YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    
    // Fallback to Date parsing
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Termin Zakazan!</h2>
              <p className="text-sm text-gray-500">Uspješno ste zakazali termin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-gray-500">{isMultiService ? 'Usluge' : 'Usluga'}</p>
              {isMultiService && services.length > 0 ? (
                <div className="space-y-1">
                  {services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <p className="font-semibold text-gray-900">
                        {service.name}
                        {service.duration > 0 && (
                          <span className="text-sm text-gray-500 ml-2">({service.duration} min)</span>
                        )}
                      </p>
                    </div>
                  ))}
                  {totalDuration > 0 && (
                    <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
                      Ukupno trajanje: {totalDuration} minuta
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-semibold text-gray-900">{serviceName}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Datum</p>
                <p className="font-semibold text-gray-900">{formatDate(appointment.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vrijeme</p>
                <p className="font-semibold text-gray-900">
                  {formatTime(appointment.time)} - {formatTime(appointment.end_time)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Salon</p>
              <p className="font-semibold text-gray-900">{salonName}</p>
              {salonAddress && (
                <p className="text-sm text-gray-600">
                  {salonAddress}
                  {salonCity && `, ${salonCity}`}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500">Frizer</p>
              <p className="font-semibold text-gray-900">{staffName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Cijena</p>
              <p className="font-semibold text-gray-900">{appointment.total_price} KM</p>
            </div>
          </div>

          {/* Email Confirmation Notice */}
          {appointment.client_email && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Potvrda poslata na email</p>
                <p className="text-blue-700 mt-1">
                  Detalji termina su poslati na {appointment.client_email}
                </p>
              </div>
            </div>
          )}

          {/* Download ICS Button */}
          <button
            onClick={handleDownloadIcs}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Preuzimanje...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Dodaj u Kalendar</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            Preuzmite .ics fajl i dodajte termin u Google Calendar, iOS Calendar ili Outlook
          </p>

          {/* Additional Info */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Molimo vas da stignete 5 minuta prije zakazanog termina
              </p>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Ukoliko ne možete doći, molimo vas da otkažete termin najmanje 24h unaprijed
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
