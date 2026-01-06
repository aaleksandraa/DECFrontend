import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  MapPin,
  Users,
  Calendar
} from 'lucide-react';
import { adminAPI } from '../../services/api';

interface ImportData {
  importId: string;
  filename: string;
  totalRows: number;
  detectedColumns: string[];
  preview: any[];
}

interface ValidationResult {
  validRows: number;
  invalidRows: number;
  errors: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
  serviceMapping?: {
    matched: number;
    unmatched: number;
    mappings: Array<{
      import_name: string;
      service_id: number | null;
      service_name: string | null;
      match_type: string;
    }>;
  };
  userCreation?: {
    existing_users: number;
    new_guest_users: number;
  };
}

interface ImportStatus {
  status: string;
  progress: number;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
}

export function AdminImportAppointments() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [selectedSalon, setSelectedSalon] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [salons, setSalons] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importBatchId, setImportBatchId] = useState<number | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load salons on mount
  React.useEffect(() => {
    loadSalons();
  }, []);

  // Load staff when salon is selected
  React.useEffect(() => {
    if (selectedSalon) {
      loadStaff(selectedSalon);
    }
  }, [selectedSalon]);

  // Poll import status
  React.useEffect(() => {
    if (importBatchId && currentStep === 5) {
      const interval = setInterval(() => {
        checkImportStatus(importBatchId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [importBatchId, currentStep]);

  const loadSalons = async () => {
    try {
      const response = await adminAPI.getSalons();
      setSalons(response.data || []);
    } catch (err) {
      console.error('Error loading salons:', err);
    }
  };

  const loadStaff = async (salonId: number) => {
    try {
      const response = await adminAPI.get(`/salons/${salonId}/staff`);
      setStaffMembers(response.data.data || []);
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    const validTypes = [
      'application/json', 
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    const validExtensions = ['.json', '.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    
    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setError('Nevažeći format fajla. Podržani formati: JSON, CSV, XLSX, XLS');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Fajl je prevelik. Maksimalna veličina: 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    await uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await adminAPI.post('/admin/import/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Greška pri upload-u fajla');
      }

      // Convert snake_case to camelCase
      const importDataConverted = {
        importId: data.data.import_id,
        filename: data.data.filename,
        totalRows: data.data.total_rows,
        detectedColumns: data.data.detected_columns || [],
        preview: data.data.preview || []
      };

      setImportData(importDataConverted);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Greška pri upload-u fajla');
    } finally {
      setLoading(false);
    }
  };

  const validateData = async () => {
    if (!importData || !selectedSalon || !selectedStaff) {
      setError('Molimo odaberite salon i frizera');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.post(`/admin/import/${importData.importId}/validate`, {
        salon_id: selectedSalon,
        staff_id: selectedStaff,
        mapping: {
          name: 'client_name',
          email: 'client_email',
          phone: 'client_phone',
          date: 'date',
          time: 'time',
          services: 'services',
          duration: 'duration'
        },
        auto_map_services: true,
        create_guest_users: true
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Greška pri validaciji');
      }

      setValidationResult(data.data);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Greška pri validaciji');
    } finally {
      setLoading(false);
    }
  };

  const startImport = async () => {
    if (!importData || !selectedSalon || !selectedStaff) {
      setError('Molimo odaberite salon i frizera');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await adminAPI.post(`/admin/import/${importData.importId}/process`, {
        salon_id: selectedSalon,
        staff_id: selectedStaff,
        mapping: {
          name: 'client_name',
          email: 'client_email',
          phone: 'client_phone',
          date: 'date',
          time: 'time',
          services: 'services',
          duration: 'duration'
        },
        auto_map_services: true,
        create_guest_users: true,
        skip_invalid: true
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || 'Greška pri pokretanju importa');
      }

      setImportBatchId(data.data.import_batch_id);
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message || 'Greška pri pokretanju importa');
    } finally {
      setLoading(false);
    }
  };

  const checkImportStatus = async (batchId: number) => {
    try {
      const response = await adminAPI.get(`/admin/import/batch/${batchId}/status`);
      const data = response.data;

      if (data.success) {
        setImportStatus(data.data);
      }
    } catch (err) {
      console.error('Error checking import status:', err);
    }
  };

  const downloadErrors = async () => {
    if (!importBatchId) return;

    try {
      const response = await adminAPI.get(`/admin/import/batch/${importBatchId}/errors`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import_errors_${importBatchId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading errors:', err);
    }
  };

  const downloadTemplate = async (format: 'json' | 'csv') => {
    try {
      const response = await adminAPI.get(`/admin/import/template/${format}`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointments-template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading template:', err);
    }
  };

  const resetImport = () => {
    setCurrentStep(1);
    setFile(null);
    setImportData(null);
    setSelectedSalon(null);
    setSelectedStaff(null);
    setValidationResult(null);
    setImportBatchId(null);
    setImportStatus(null);
    setError(null);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
            currentStep >= step 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 5 && (
            <div className={`w-16 h-1 ${
              currentStep > step ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Fajla</h2>
        <p className="text-gray-600">Odaberite JSON ili CSV fajl sa terminima</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Prevucite fajl ovdje ili kliknite za odabir
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Podržani formati: JSON, CSV (;), Excel (XLSX, XLS) - max 10MB
        </p>
        <input
          type="file"
          accept=".json,.csv,.xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium cursor-pointer hover:shadow-lg transition-shadow"
        >
          Odaberi fajl
        </label>
      </div>

      {file && (
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button
            onClick={() => setFile(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📄 Preuzmi template:</h3>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTemplate('json')}
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            JSON Template
          </button>
          <button
            onClick={() => downloadTemplate('csv')}
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            CSV Template
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="ml-3 text-gray-600">Upload u toku...</span>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pregled Podataka</h2>
        <p className="text-gray-600">Provjeri podatke prije importa</p>
      </div>

      {importData && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Fajl</p>
              <p className="text-lg font-bold text-blue-900">{importData.filename}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">Ukupno redova</p>
              <p className="text-lg font-bold text-green-900">{importData.totalRows}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">Kolone</p>
              <p className="text-lg font-bold text-purple-900">{importData.detectedColumns.length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Pregled prvih 10 redova</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {importData.detectedColumns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importData.preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {importData.detectedColumns.map((col) => (
                        <td key={col} className="px-4 py-3 text-sm text-gray-900">
                          {row[col] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Nazad
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg"
            >
              Dalje
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mapiranje Podataka</h2>
        <p className="text-gray-600">Odaberi salon i frizera za import</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Salon
          </label>
          <select
            value={selectedSalon || ''}
            onChange={(e) => setSelectedSalon(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Odaberi salon...</option>
            {salons.map((salon) => (
              <option key={salon.id} value={salon.id}>
                {salon.name} - {salon.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Frizer
          </label>
          <select
            value={selectedStaff || ''}
            onChange={(e) => setSelectedStaff(Number(e.target.value))}
            disabled={!selectedSalon}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Odaberi frizera...</option>
            {staffMembers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Automatsko mapiranje:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usluge će biti automatski mapirane po nazivu (exact + fuzzy 90%)</li>
          <li>• Korisnici će biti automatski kreirani kao "guest" za analitiku</li>
          <li>• Ako se korisnik registruje kasnije, termini će biti automatski povezani</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Nazad
        </button>
        <button
          onClick={validateData}
          disabled={!selectedSalon || !selectedStaff || loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validacija...
            </>
          ) : (
            <>
              Validiraj
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Validacija</h2>
        <p className="text-gray-600">Provjeri rezultate validacije</p>
      </div>

      {validationResult && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700">Validni redovi</p>
                  <p className="text-2xl font-bold text-green-900">{validationResult.validRows}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-red-700">Redovi sa greškama</p>
                  <p className="text-2xl font-bold text-red-900">{validationResult.invalidRows}</p>
                </div>
              </div>
            </div>
          </div>

          {validationResult.serviceMapping && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📊 Mapiranje usluga</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Pronađeno: <strong>{validationResult.serviceMapping.matched}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">
                    Nije pronađeno: <strong>{validationResult.serviceMapping.unmatched}</strong>
                  </span>
                </div>
              </div>
              {validationResult.serviceMapping.unmatched > 0 && (
                <p className="text-sm text-gray-600">
                  ℹ️ Termini bez usluge će biti kreirani sa service_id=NULL
                </p>
              )}
            </div>
          )}

          {validationResult.userCreation && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">👤 Kreiranje korisnika</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Postojeći: <strong>{validationResult.userCreation.existing_users}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Novi guest: <strong>{validationResult.userCreation.new_guest_users}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {validationResult.errors.length > 0 && (
            <div className="bg-white border border-red-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                <h3 className="font-semibold text-red-900">Greške (prvih 10)</h3>
              </div>
              <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
                {validationResult.errors.slice(0, 10).map((error, idx) => (
                  <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-1">Red {error.row}</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {error.errors.map((err, errIdx) => (
                        <li key={errIdx}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Nazad
            </button>
            <button
              onClick={startImport}
              disabled={loading || validationResult.validRows === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pokretanje...
                </>
              ) : (
                <>
                  Pokreni Import
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import</h2>
        <p className="text-gray-600">
          {importStatus?.status === 'completed' ? 'Import završen!' : 'Import u toku...'}
        </p>
      </div>

      {importStatus && (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progres</span>
                <span>{importStatus.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  style={{ width: `${importStatus.progress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-700">Ukupno</p>
                <p className="text-2xl font-bold text-blue-900">{importStatus.total_rows}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700">Uspješno</p>
                <p className="text-2xl font-bold text-green-900">{importStatus.successful_rows}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-700">Neuspješno</p>
                <p className="text-2xl font-bold text-red-900">{importStatus.failed_rows}</p>
              </div>
            </div>
          </div>

          {importStatus.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">Import uspješno završen! 🎉</h3>
                  <p className="text-sm text-green-800">
                    Uspješno importovano {importStatus.successful_rows} od {importStatus.total_rows} termina.
                  </p>
                  {importStatus.failed_rows > 0 && (
                    <button
                      onClick={downloadErrors}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Preuzmi greške (CSV)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {importStatus.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Import nije uspio</h3>
                  <p className="text-sm text-red-800">
                    Došlo je do greške tokom importa. Molimo pokušajte ponovo.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={resetImport}
              disabled={importStatus.status === 'processing'}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Novi Import
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Termina</h1>
          <p className="text-gray-600">Importuj termine iz JSON ili CSV fajla</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>
    </div>
  );
}
