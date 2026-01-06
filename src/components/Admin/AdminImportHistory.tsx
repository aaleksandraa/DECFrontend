import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Loader2,
  FileText,
  Clock
} from 'lucide-react';

interface ImportBatch {
  id: number;
  filename: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  status: string;
  created_at: string;
  salon: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
  };
}

export function AdminImportHistory() {
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/admin/import/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Greška pri učitavanju historije');
      }

      setImports(data.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Greška pri učitavanju historije');
    } finally {
      setLoading(false);
    }
  };

  const downloadErrors = async (importBatchId: number) => {
    try {
      const response = await fetch(`/api/v1/admin/import/batch/${importBatchId}/errors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Nema grešaka za preuzimanje');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import_errors_${importBatchId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Greška pri preuzimanju');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Završeno
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            U toku
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Neuspješno
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-Latn-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="ml-3 text-gray-600">Učitavanje...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Greška</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historija Importa</h1>
          <p className="text-gray-600 mt-1">Pregled svih prethodnih importa</p>
        </div>
        <button
          onClick={loadImportHistory}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Osvježi
        </button>
      </div>

      {imports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema importa</h3>
          <p className="text-gray-600">Još uvijek niste izvršili nijedan import.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Datum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Fajl
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Salon
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Ukupno
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Uspješno
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Neuspješno
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {imports.map((importBatch) => (
                  <tr key={importBatch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(importBatch.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        {importBatch.filename}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {importBatch.salon.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {importBatch.total_rows}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {importBatch.successful_rows}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600">
                      {importBatch.failed_rows}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(importBatch.status)}
                    </td>
                    <td className="px-6 py-4">
                      {importBatch.failed_rows > 0 && (
                        <button
                          onClick={() => downloadErrors(importBatch.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Greške
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
