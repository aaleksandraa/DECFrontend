import { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  Users,
  Star,
  Clock,
  Download,
  FileText,
  X,
  ChevronDown,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, staffAPI } from '../../services/api';

type PeriodOption = 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

export function SalonAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  
  // Period selection
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('this_month');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [exporting, setExporting] = useState(false);
  
  // Staff filter - hidden for staff users (they only see their own data)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const isStaff = user?.role === 'frizer';
  const salonId = user?.salon?.id || user?.staff_profile?.salon_id;

  useEffect(() => {
    loadStaff();
  }, [user]);

  useEffect(() => {
    if (staff.length >= 0) { // Load even if no staff
      loadAnalytics();
    }
  }, [selectedPeriod, customDateStart, customDateEnd, selectedStaffId, staff]);

  const loadStaff = async () => {
    // Staff users don't need to load staff list (they only see their own data)
    if (isStaff || !salonId) return;

    try {
      const staffResponse = await staffAPI.getStaff(salonId);
      const staffData = Array.isArray(staffResponse) ? staffResponse : (staffResponse?.data || []);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]);
    }
  };

  const loadAnalytics = async () => {
    if (!salonId) return;

    try {
      setLoading(true);
      
      const params: any = {
        period: selectedPeriod
      };

      // For staff users, backend automatically filters to their own data
      // For salon owners, use the selected staff filter
      if (!isStaff && selectedStaffId) {
        params.staff_id = selectedStaffId;
      }

      if (selectedPeriod === 'custom' && customDateStart && customDateEnd) {
        params.start_date = customDateStart;
        params.end_date = customDateEnd;
      }

      const data = await dashboardAPI.getSalonAnalytics(params);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!analytics) return;
    
    setExporting(true);
    
    try {
      const reportData = {
        period: analytics.period.label,
        generatedAt: new Date().toLocaleString('bs-BA'),
        salonName: user?.salon?.name || user?.staff_profile?.name || 'Salon',
        staffFilter: isStaff 
          ? user?.staff_profile?.name || 'Zaposleni'
          : (selectedStaffId ? staff.find(s => s.id === selectedStaffId)?.name : 'Svi zaposleni'),
        stats: analytics.stats,
        topServices: analytics.top_services || [],
        topStaff: analytics.top_staff || [],
        timeSlots: analytics.time_slots || []
      };

      if (exportFormat === 'csv') {
        let csv = 'Izvještaj analitike salona\n\n';
        csv += `Period,${reportData.period}\n`;
        csv += `Generisano,${reportData.generatedAt}\n`;
        csv += `Salon,${reportData.salonName}\n`;
        csv += `Filter,${reportData.staffFilter}\n\n`;
        
        csv += 'STATISTIKA\n';
        csv += `Ukupan prihod,${reportData.stats.total_revenue} KM\n`;
        csv += `Broj termina,${reportData.stats.total_appointments}\n`;
        csv += `Završeno,${reportData.stats.completed_appointments}\n`;
        csv += `Novi klijenti,${reportData.stats.unique_clients}\n`;
        csv += `Stopa završetka,${reportData.stats.completion_rate}%\n\n`;
        
        csv += 'NAJPOPULARNIJE USLUGE\n';
        csv += 'Usluga,Rezervacije,Prihod\n';
        reportData.topServices.forEach((s: any) => {
          csv += `${s.name},${s.bookings},${s.revenue} KM\n`;
        });
        csv += '\n';
        
        if (reportData.topStaff.length > 0) {
          csv += 'PERFORMANSE ZAPOSLENIH\n';
          csv += 'Ime,Termini,Prihod,Ocjena\n';
          reportData.topStaff.forEach((s: any) => {
            csv += `${s.name},${s.bookings},${s.revenue} KM,${s.rating}\n`;
          });
          csv += '\n';
        }
        
        csv += 'ANALIZA PO SATIMA\n';
        csv += 'Vrijeme,Termini,Postotak\n';
        reportData.timeSlots.forEach((s: any) => {
          csv += `${s.time},${s.bookings},${s.percentage}%\n`;
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analitika-${reportData.period.replace(/\s/g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Izvještaj analitike - ${reportData.salonName}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                h1 { color: #1f2937; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
                h2 { color: #374151; margin-top: 30px; }
                .info { margin-bottom: 20px; color: #6b7280; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                th { background: #f9fafb; font-weight: 600; }
                .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
                .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
                .stat-label { color: #6b7280; margin-top: 5px; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>
              <h1>📊 Izvještaj analitike salona</h1>
              <div class="info">
                <p><strong>Salon:</strong> ${reportData.salonName}</p>
                <p><strong>Period:</strong> ${reportData.period}</p>
                <p><strong>Filter:</strong> ${reportData.staffFilter}</p>
                <p><strong>Generisano:</strong> ${reportData.generatedAt}</p>
              </div>
              
              <h2>Statistika</h2>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-value">${reportData.stats.total_revenue} KM</div>
                  <div class="stat-label">Ukupan prihod</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.stats.total_appointments}</div>
                  <div class="stat-label">Broj termina</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.stats.unique_clients}</div>
                  <div class="stat-label">Novi klijenti</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.stats.completion_rate}%</div>
                  <div class="stat-label">Stopa završetka</div>
                </div>
              </div>
              
              <h2>Najpopularnije usluge</h2>
              ${reportData.topServices.length > 0 ? `
              <table>
                <thead>
                  <tr><th>Usluga</th><th>Rezervacije</th><th>Prihod</th></tr>
                </thead>
                <tbody>
                  ${reportData.topServices.map((s: any) => `<tr><td>${s.name}</td><td>${s.bookings}</td><td>${s.revenue} KM</td></tr>`).join('')}
                </tbody>
              </table>
              ` : '<p style="color: #6b7280; padding: 20px 0;">Nema podataka o uslugama za odabrani period</p>'}
              
              ${reportData.topStaff.length > 0 ? `
              <h2>Performanse zaposlenih</h2>
              <table>
                <thead>
                  <tr><th>Ime</th><th>Termini</th><th>Prihod</th><th>Ocjena</th></tr>
                </thead>
                <tbody>
                  ${reportData.topStaff.map((s: any) => `<tr><td>${s.name}</td><td>${s.bookings}</td><td>${s.revenue} KM</td><td>⭐ ${s.rating}</td></tr>`).join('')}
                </tbody>
              </table>
              ` : ''}
              
              <h2>Analiza termina po satima</h2>
              <table>
                <thead>
                  <tr><th>Vrijeme</th><th>Broj termina</th><th>Zauzetost</th></tr>
                </thead>
                <tbody>
                  ${reportData.timeSlots.map((s: any) => `<tr><td>${s.time}</td><td>${s.bookings}</td><td>${s.percentage}%</td></tr>`).join('')}
                </tbody>
              </table>
              
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  const handlePeriodChange = (period: PeriodOption) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setShowCustomPicker(false);
    }
  };

  const applyCustomDates = () => {
    if (customDateStart && customDateEnd) {
      setSelectedPeriod('custom');
      setShowCustomPicker(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Greška pri učitavanju analitike</p>
      </div>
    );
  }

  const stats = analytics.stats;
  const comparison = analytics.comparison;
  const topServices = analytics.top_services || [];
  const topStaff = analytics.top_staff || [];
  const timeSlots = analytics.time_slots || [];

  const getChangeDisplay = (change: any) => {
    if (!change) return { value: '0%', type: 'neutral' as const };
    return {
      value: `${change.direction === 'up' ? '+' : change.direction === 'down' ? '-' : ''}${change.value}%`,
      type: change.direction === 'up' ? 'positive' as const : change.direction === 'down' ? 'negative' as const : 'neutral' as const
    };
  };

  const revenueChange = getChangeDisplay(comparison?.revenue_change);
  const appointmentChange = getChangeDisplay(comparison?.appointments_change);
  const clientsChange = getChangeDisplay(comparison?.clients_change);

  const analyticsStats = [
    {
      label: 'Ukupan prihod',
      value: `${stats.total_revenue} KM`,
      change: revenueChange.value,
      changeType: revenueChange.type,
      icon: DollarSign,
      color: 'green'
    },
    {
      label: 'Broj termina',
      value: stats.total_appointments.toString(),
      change: appointmentChange.value,
      changeType: appointmentChange.type,
      icon: Calendar,
      color: 'blue'
    },
    {
      label: 'Novi klijenti',
      value: stats.unique_clients.toString(),
      change: clientsChange.value,
      changeType: clientsChange.type,
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Stopa završetka',
      value: `${stats.completion_rate}%`,
      change: '',
      changeType: 'neutral' as const,
      icon: Star,
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analitika salona</h1>
          <p className="text-sm text-gray-600 mt-1">
            Period: {analytics.period.label}
            {!isStaff && selectedStaffId && ` • ${staff.find(s => s.id === selectedStaffId)?.name}`}
            {isStaff && ` • ${user?.staff_profile?.name || 'Moji podaci'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Staff Filter - Only show for salon owners */}
          {!isStaff && staff.length > 0 && (
            <div className="relative">
              <select 
                value={selectedStaffId || ''}
                onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
                className="appearance-none bg-white px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
              >
                <option value="">Svi zaposleni</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
          
          {/* Period Filter */}
          <div className="relative">
            <select 
              value={selectedPeriod === 'custom' ? 'custom' : selectedPeriod}
              onChange={(e) => {
                const value = e.target.value as PeriodOption;
                if (value === 'custom') {
                  setShowCustomPicker(true);
                } else {
                  handlePeriodChange(value);
                }
              }}
              className="appearance-none bg-white px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
            >
              <option value="this_month">Ovaj mjesec</option>
              <option value="last_month">Prošli mjesec</option>
              <option value="this_year">Ova godina</option>
              <option value="last_year">Prošla godina</option>
              <option value="custom">Prilagođeno...</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Izvezi izvještaj
          </button>
        </div>
      </div>

      {/* Custom Date Picker Modal */}
      {showCustomPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Odaberite period</h3>
              <button onClick={() => setShowCustomPicker(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Od datuma</label>
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do datuma</label>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    setCustomDateStart(new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]);
                    setCustomDateEnd(now.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Zadnja 3 mjeseca
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setCustomDateStart(new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0]);
                    setCustomDateEnd(now.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Zadnjih 6 mjeseci
                </button>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowCustomPicker(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Otkaži
                </button>
                <button
                  onClick={applyCustomDates}
                  disabled={!customDateStart || !customDateEnd}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Primijeni
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Izvezi izvještaj</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Izvještaj za period: <strong>{analytics.period.label}</strong>
              {!isStaff && selectedStaffId && <><br/>Filter: <strong>{staff.find(s => s.id === selectedStaffId)?.name}</strong></>}
              {isStaff && <><br/>Zaposleni: <strong>{user?.staff_profile?.name}</strong></>}
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportFormat"
                  checked={exportFormat === 'pdf'}
                  onChange={() => setExportFormat('pdf')}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium">PDF / Print</p>
                  <p className="text-sm text-gray-500">Za štampanje ili dijeljenje</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="exportFormat"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <FileText className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">CSV</p>
                  <p className="text-sm text-gray-500">Za Excel, Google Sheets</p>
                </div>
              </label>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Otkaži
              </button>
              <button
                onClick={exportReport}
                disabled={exporting}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Izvoz...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Izvezi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {analyticsStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">vs prethodni period</span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'purple' ? 'bg-purple-100' :
                  'bg-yellow-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-yellow-600'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Najpopularnije usluge</h3>
            <p className="text-sm text-gray-600">Po broju rezervacija</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topServices.length > 0 ? (
                topServices.map((service: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-600">{service.bookings} rezervacija</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{service.revenue} KM</p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${service.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nema podataka za odabrani period</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Staff Performance */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Performanse zaposlenih</h3>
            <p className="text-sm text-gray-600">Za odabrani period</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topStaff.length > 0 ? (
                topStaff.map((staffMember: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{staffMember.name}</h4>
                        <p className="text-sm text-gray-600">{staffMember.bookings} termina</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{staffMember.revenue} KM</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm">{staffMember.rating}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nema podataka za odabrani period</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Time Slot Analysis */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Analiza termina po satima</h3>
          <p className="text-sm text-gray-600">Zauzetost po satima dana</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {timeSlots.map((slot: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{slot.time}</p>
                    <p className="text-xs text-gray-600">{slot.bookings} termina</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{slot.percentage}%</p>
                  <div className="w-12 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full ${
                        slot.percentage >= 80 ? 'bg-red-500' :
                        slot.percentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(slot.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
