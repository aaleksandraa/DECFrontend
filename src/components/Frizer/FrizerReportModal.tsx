import { useState } from 'react';
import { X, FileText, Download, Loader } from 'lucide-react';
import { formatDateEuropean } from '../../utils/dateUtils';
import { StaffRole, StaffRoleLabels } from '../../types';

interface FrizerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  appointments: any[];
}

export function FrizerReportModal({ isOpen, onClose, staff, appointments }: FrizerReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    period: 'month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeRevenue: true,
    includeAppointments: true,
    includeServices: true,
    includeRatings: true,
  });

  if (!isOpen) return null;

  const getFilteredAppointments = () => {
    const start = new Date(reportConfig.startDate);
    const end = new Date(reportConfig.endDate);
    end.setHours(23, 59, 59);

    return appointments.filter(app => {
      const [day, month, year] = app.date.split('.');
      const appDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return appDate >= start && appDate <= end;
    });
  };

  const calculateStats = () => {
    const filtered = getFilteredAppointments();
    const completed = filtered.filter(a => a.status === 'completed');
    const cancelled = filtered.filter(a => a.status === 'cancelled');
    
    const totalRevenue = completed.reduce((sum, a) => sum + (a.total_price || 0), 0);
    
    // Services breakdown
    const serviceStats: { [key: string]: { count: number; revenue: number; name: string } } = {};
    completed.forEach(app => {
      const serviceId = app.service_id || app.service?.id;
      const serviceName = app.service?.name || 'Nepoznata usluga';
      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = { count: 0, revenue: 0, name: serviceName };
      }
      serviceStats[serviceId].count++;
      serviceStats[serviceId].revenue += app.total_price || 0;
    });

    return {
      total: filtered.length,
      completed: completed.length,
      cancelled: cancelled.length,
      pending: filtered.filter(a => a.status === 'pending').length,
      confirmed: filtered.filter(a => a.status === 'confirmed').length,
      totalRevenue,
      avgPerDay: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
      services: Object.values(serviceStats).sort((a, b) => b.count - a.count),
    };
  };

  const handlePeriodChange = (period: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setReportConfig(prev => ({
      ...prev,
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
  };

  const generatePDF = async () => {
    setLoading(true);
    
    try {
      const stats = calculateStats();
      const filtered = getFilteredAppointments();
      
      // Create PDF content using browser's print functionality
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Molimo dozvolite pop-up prozore za generisanje PDF-a');
        setLoading(false);
        return;
      }

      const startDateFormatted = formatDateEuropean(new Date(reportConfig.startDate));
      const endDateFormatted = formatDateEuropean(new Date(reportConfig.endDate));

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Izvještaj - ${staff.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #3b82f6; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 { color: #1e40af; font-size: 28px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; }
            .period { 
              background: #f0f9ff; 
              padding: 15px; 
              border-radius: 8px; 
              margin-bottom: 30px;
              text-align: center;
            }
            .period strong { color: #1e40af; }
            .section { margin-bottom: 30px; }
            .section-title { 
              font-size: 18px; 
              color: #1e40af; 
              border-bottom: 2px solid #e5e7eb; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 15px; 
              margin-bottom: 20px; 
            }
            .stat-box { 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 8px; 
              text-align: center;
              border: 1px solid #e2e8f0;
            }
            .stat-box .value { 
              font-size: 28px; 
              font-weight: bold; 
              color: #1e40af; 
            }
            .stat-box .label { 
              font-size: 12px; 
              color: #64748b; 
              margin-top: 5px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
            }
            th, td { 
              padding: 12px; 
              text-align: left; 
              border-bottom: 1px solid #e2e8f0; 
            }
            th { 
              background: #f1f5f9; 
              font-weight: 600; 
              color: #475569; 
            }
            tr:hover { background: #f8fafc; }
            .status { 
              padding: 4px 10px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: 500;
            }
            .status-completed { background: #dcfce7; color: #166534; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            .status-confirmed { background: #fef3c7; color: #92400e; }
            .status-pending { background: #e0e7ff; color: #3730a3; }
            .footer { 
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #e2e8f0; 
              text-align: center; 
              color: #94a3b8; 
              font-size: 12px; 
            }
            .revenue-highlight {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 25px;
              border-radius: 12px;
              text-align: center;
              margin-bottom: 20px;
            }
            .revenue-highlight .amount {
              font-size: 36px;
              font-weight: bold;
            }
            .revenue-highlight .label {
              font-size: 14px;
              opacity: 0.9;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Mjesečni izvještaj</h1>
            <p>${staff.name} - ${StaffRoleLabels[staff.role as StaffRole] || staff.role}</p>
          </div>

          <div class="period">
            <strong>Period:</strong> ${startDateFormatted} - ${endDateFormatted}
          </div>

          ${reportConfig.includeRevenue ? `
            <div class="revenue-highlight">
              <div class="amount">${stats.totalRevenue.toFixed(2)} KM</div>
              <div class="label">Ukupan prihod u periodu</div>
            </div>
          ` : ''}

          ${reportConfig.includeAppointments ? `
            <div class="section">
              <h2 class="section-title">📊 Statistika termina</h2>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="value">${stats.total}</div>
                  <div class="label">Ukupno termina</div>
                </div>
                <div class="stat-box">
                  <div class="value">${stats.completed}</div>
                  <div class="label">Završeno</div>
                </div>
                <div class="stat-box">
                  <div class="value">${stats.cancelled}</div>
                  <div class="label">Otkazano</div>
                </div>
                <div class="stat-box">
                  <div class="value">${stats.completed > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
                  <div class="label">Stopa završenosti</div>
                </div>
              </div>
            </div>
          ` : ''}

          ${reportConfig.includeServices && stats.services.length > 0 ? `
            <div class="section">
              <h2 class="section-title">💇 Usluge po popularnosti</h2>
              <table>
                <thead>
                  <tr>
                    <th>Usluga</th>
                    <th>Broj termina</th>
                    <th>Prihod</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.services.map(s => `
                    <tr>
                      <td>${s.name}</td>
                      <td>${s.count}</td>
                      <td>${s.revenue.toFixed(2)} KM</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${reportConfig.includeRatings ? `
            <div class="section">
              <h2 class="section-title">⭐ Ocjena i recenzije</h2>
              <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="stat-box">
                  <div class="value">${staff.rating?.toFixed(1) || '0.0'}</div>
                  <div class="label">Prosječna ocjena</div>
                </div>
                <div class="stat-box">
                  <div class="value">${staff.review_count || 0}</div>
                  <div class="label">Broj recenzija</div>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="section">
            <h2 class="section-title">📋 Detaljna lista termina</h2>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Vrijeme</th>
                  <th>Klijent</th>
                  <th>Usluga</th>
                  <th>Cijena</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.slice(0, 50).map(app => `
                  <tr>
                    <td>${app.date}</td>
                    <td>${app.time}</td>
                    <td>${app.client_name || 'N/A'}</td>
                    <td>${app.service?.name || 'N/A'}</td>
                    <td>${app.total_price?.toFixed(2) || '0.00'} KM</td>
                    <td>
                      <span class="status status-${app.status}">
                        ${app.status === 'completed' ? 'Završeno' : 
                          app.status === 'cancelled' ? 'Otkazano' : 
                          app.status === 'confirmed' ? 'Potvrđeno' : 
                          app.status === 'pending' ? 'Na čekanju' : app.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
                ${filtered.length > 50 ? `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #666;">
                      ... i još ${filtered.length - 50} termina
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Izvještaj generisan: ${formatDateEuropean(new Date())} u ${new Date().toLocaleTimeString('bs-BA')}</p>
            <p>SalonBooking.ba - Sistem za upravljanje frizerskim salonima</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Greška pri generisanju izvještaja');
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Izvezi izvještaj</h2>
              <p className="text-sm text-gray-600">Konfiguriši i preuzmi PDF izvještaj</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Period izvještaja</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { id: 'week', label: 'Sedmica' },
                { id: 'month', label: 'Mjesec' },
                { id: 'quarter', label: 'Kvartal' },
                { id: 'year', label: 'Godina' },
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => handlePeriodChange(period.id)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    reportConfig.period === period.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Od datuma</label>
                <input
                  type="date"
                  value={reportConfig.startDate}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value, period: 'custom' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Do datuma</label>
                <input
                  type="date"
                  value={reportConfig.endDate}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value, period: 'custom' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Uključi u izvještaj</label>
            <div className="space-y-3">
              {[
                { id: 'includeRevenue', label: 'Prihod i zarada', icon: '💰' },
                { id: 'includeAppointments', label: 'Statistika termina', icon: '📊' },
                { id: 'includeServices', label: 'Analiza usluga', icon: '💇' },
                { id: 'includeRatings', label: 'Ocjene i recenzije', icon: '⭐' },
              ].map(option => (
                <label key={option.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={reportConfig[option.id as keyof typeof reportConfig] as boolean}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, [option.id]: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xl">{option.icon}</span>
                  <span className="text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preview Stats */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-3">Pregled podataka za izvještaj</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-blue-700">Termina</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-green-700">Završeno</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.totalRevenue.toFixed(0)} KM</div>
                <div className="text-xs text-purple-700">Prihod</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Odustani
            </button>
            <button
              onClick={generatePDF}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generisanje...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generiši PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
